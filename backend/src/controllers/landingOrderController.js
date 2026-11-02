import { randomBytes } from "node:crypto";
import LandingPage from "../models/LandingPage.js";
import LandingOrder from "../models/LandingOrder.js";

const requestPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function publicOrder(order) {
  return {
    orderNumber: order.orderNumber,
    total: order.total,
    status: order.status,
    productTitle: order.productTitle
  };
}

export async function createLandingOrder(req, res, next) {
  try {
    const { customer, quantity, clientRequestId } = req.body || {};

    if (
      typeof clientRequestId !== "string" ||
      !requestPattern.test(clientRequestId)
    ) {
      return fail(res, 400, "Invalid checkout request ID");
    }

    const existing = await LandingOrder.findOne({ clientRequestId });

    if (existing) {
      if (existing.pageSlug !== req.params.slug) {
        return fail(res, 409, "Request ID already used");
      }
      return res.json({
        success: true,
        data: publicOrder(existing),
        duplicate: true
      });
    }

    if (!customer || typeof customer !== "object" || Array.isArray(customer)) {
      return fail(res, 400, "Customer information is required");
    }

    const name = String(customer.name || "").trim();
    const phone = String(customer.phone || "").trim();
    const district = String(customer.district || "").trim();
    const address = String(customer.address || "").trim();
    const area = customer.deliveryArea;

    if (
      name.length < 2 || name.length > 120 ||
      !/^(?:\+?88)?01[3-9]\d{8}$/.test(phone) ||
      district.length < 2 || district.length > 100 ||
      address.length < 8 || address.length > 500 ||
      !["inside", "outside"].includes(area) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 10
    ) {
      return fail(res, 400, "Please provide valid customer details");
    }

    const page = await LandingPage.findOne({
      slug: req.params.slug,
      status: "published"
    });

    if (!page || page.delivery?.cashOnDelivery !== true) {
      return fail(res, 404, "Landing page is not available for ordering");
    }

    const unitPrice = page.pricing?.salePrice;

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return fail(res, 409, "Product price is unavailable");
    }

    const subtotal = Math.round(unitPrice * quantity * 100) / 100;
    // TEMPORARY POLICY: Free home delivery on all landing orders.
    const charge = 0;

    if (!Number.isFinite(charge) || charge < 0) {
      return fail(res, 409, "Delivery charge is unavailable");
    }

    const total = Math.round((subtotal + charge) * 100) / 100;
    const orderNumber = "LP-" +
      Date.now().toString(36).toUpperCase() +
      "-" + randomBytes(4).toString("hex").toUpperCase();

    let order;

    try {
      order = await LandingOrder.create({
        orderNumber,
        clientRequestId,
        landingPage: page._id,
        pageSlug: page.slug,
        productTitle: page.title,
        productImage: page.images?.[0]?.url || "",
        quantity,
        unitPrice,
        subtotal,
        deliveryCharge: charge,
        total,
        customer: { name, phone, district, address, deliveryArea: area },
        paymentMethod: "COD",
        status: "pending"
      });
    } catch (error) {
      if (error.code === 11000) {
        const duplicate = await LandingOrder.findOne({ clientRequestId });
        if (duplicate && duplicate.pageSlug === page.slug) {
          return res.json({
            success: true,
            data: publicOrder(duplicate),
            duplicate: true
          });
        }
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Landing page order placed successfully",
      data: publicOrder(order)
    });
  } catch (error) {
    next(error);
  }
}

export async function listLandingOrders(req, res, next) {
  try {
    const orders = await LandingOrder.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
}

export async function changeLandingOrderStatus(req, res, next) {
  try {
    const allowed = [
      "pending", "confirmed", "shipped", "delivered", "cancelled"
    ];

    const status = req.body?.status;

    if (!allowed.includes(status)) {
      return fail(res, 400, "Invalid order status");
    }

    const transitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: []
    };

    const order = await LandingOrder.findById(req.params.id);

    if (!order) return fail(res, 404, "Order not found");

    if (
      order.status !== status &&
      !transitions[order.status]?.includes(status)
    ) {
      return fail(res, 409, "Invalid order status transition");
    }

    order.status = status;
    await order.save();

    return res.json({ success: true, data: order });
  } catch (error) {
    if (error.name === "CastError") {
      return fail(res, 400, "Invalid order ID");
    }
    next(error);
  }
}
