import { sendMetaPurchase } from "../services/metaPurchase.js";
import { getDeliverySettings } from "../services/deliverySettings.js";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const DELIVERY = { inside: 70, outside: 130 };

const TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

function bad(res, message, status = 400) {
  return res.status(status).json({
    success: false,
    message
  });
}

function orderResponse(order) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total
  };
}

// CUSTOMER: CREATE COD ORDER

export async function createOrder(req, res, next) {
  try {
    const { customer, items, clientRequestId } = req.body || {};

    if (
      typeof clientRequestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(clientRequestId)
    ) {
      return bad(res, "Invalid checkout request ID");
    }

    const existing = await Order.findOne({ clientRequestId });

    if (existing) {
      return res.json({
        success: true,
        data: orderResponse(existing),
        duplicate: true
      });
    }

    if (
      !customer ||
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 30
    ) {
      return bad(res, "Customer and valid items are required");
    }

    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const address = String(customer.address || "").trim();
    const district = String(customer.district || "").trim();
    const area = customer.deliveryArea;

    if (
      name.length < 2 || name.length > 120 ||
      !/^(?:\+?88)?01[3-9]\d{8}$/.test(phone) ||
      address.length < 8 || address.length > 500 ||
      district.length < 2 || district.length > 100 ||
      !Object.hasOwn(DELIVERY, area)
    ) {
      return bad(res, "Please provide valid delivery information");
    }

    const ids = items.map(item => item.productId);

    if (
      !ids.every(id => mongoose.isValidObjectId(id)) ||
      new Set(ids).size !== ids.length ||
      !items.every(item =>
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 20
      )
    ) {
      return bad(res, "Invalid product or quantity");
    }

    const products = await Product.find({
      _id: { $in: ids },
      isActive: true
    });

    const byId = new Map(
      products.map(product => [String(product._id), product])
    );

    const lines = [];

    for (const item of items) {
      const product = byId.get(item.productId);

      if (!product) {
        return bad(res, "A selected product is unavailable");
      }

      if (product.stock < item.quantity) {
        return bad(res, `Insufficient stock: ${product.name}`, 409);
      }

      lines.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }

    const subtotal = lines.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const rates = await getDeliverySettings();

    const orderNumber =
      "MAX-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      randomBytes(4).toString("hex").toUpperCase();

    let order;

    try {
      order = await Order.create({
        orderNumber,
        clientRequestId,
        customer: {
          name,
          phone,
          address,
          district,
          deliveryArea: area
        },
        items: lines,
        subtotal,
        deliveryCharge: rates[area],
        total: subtotal + rates[area],
        paymentMethod: "COD",
        status: "pending"
      });
    } catch (error) {
      if (error.code === 11000) {
        const duplicate = await Order.findOne({ clientRequestId });

        if (duplicate) {
          return res.json({
            success: true,
            data: orderResponse(duplicate),
            duplicate: true
          });
        }
      }
      throw error;
    }

    // Order is already saved. Meta errors must not cancel it.
    // Only send when the customer has opted in to tracking.
    if (req.body?.marketingConsent === true) {
      try {
        const origin = new URL(
          req.headers.origin || process.env.FRONTEND_URL || ""
        );

        if (origin.protocol === "https:") {
          await sendMetaPurchase(order, {
            consent: true,
            sourceUrl: `${origin.origin}/checkout`,
            userAgent: req.headers["user-agent"],
            ip: req.ip
          });
        } else {
          console.info(
            "Meta CAPI skipped: HTTPS storefront URL required"
          );
        }
      } catch (metaError) {
        console.error("Meta Purchase delivery failed:", metaError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: orderResponse(order)
    });
  } catch (error) {
    next(error);
  }
}

// ADMIN: LIST ORDERS

export async function listOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

// ADMIN: SAFE ORDER STATUS UPDATE

export async function updateOrderStatus(req, res, next) {
  const { status } = req.body || {};

  if (
    !mongoose.isValidObjectId(req.params.id) ||
    !["confirmed", "shipped", "delivered", "cancelled"].includes(status)
  ) {
    return bad(res, "Invalid order or status");
  }

  const session = await mongoose.startSession();

  try {
    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);

      if (!order) {
        const err = new Error("Order not found");
        err.httpStatus = 404;
        throw err;
      }

      if (order.status === status) {
        updatedOrder = order;
        return;
      }

      if (!TRANSITIONS[order.status]?.includes(status)) {
        const err = new Error(
          `Cannot change ${order.status} order to ${status}`
        );
        err.httpStatus = 409;
        throw err;
      }

      // Confirm: reserve available inventory atomically
      if (order.status === "pending" && status === "confirmed") {
        for (const item of order.items) {
          const result = await Product.updateOne(
            {
              _id: item.product,
              isActive: true,
              stock: { $gte: item.quantity }
            },
            { $inc: { stock: -item.quantity } },
            { session }
          );

          if (result.modifiedCount !== 1) {
            const err = new Error(
              `Insufficient inventory for ${item.name}`
            );
            err.httpStatus = 409;
            throw err;
          }
        }

        order.confirmedAt = new Date();
      }

      // Cancel confirmed order: return reserved stock
      if (order.status === "confirmed" && status === "cancelled") {
        for (const item of order.items) {
          const result = await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session }
          );

          if (result.modifiedCount !== 1) {
            const err = new Error(
              `Could not restore inventory for ${item.name}`
            );
            err.httpStatus = 409;
            throw err;
          }
        }
      }

      if (status === "cancelled") {
        order.cancelledAt = new Date();
      }

      order.status = status;
      await order.save({ session });
      updatedOrder = order;
    });

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    if (error.httpStatus) {
      return bad(res, error.message, error.httpStatus);
    }

    next(error);
  } finally {
    await session.endSession();
  }
}
