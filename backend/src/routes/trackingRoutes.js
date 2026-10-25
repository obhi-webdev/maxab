import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import Order from "../models/Order.js";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

router.post("/", limiter, async (req, res, next) => {
  try {
    const number = String(req.body?.orderNumber || "")
      .trim()
      .toUpperCase();

    const phone = String(req.body?.phone || "")
      .trim()
      .replace(/\D/g, "");

    if (
      !/^MAX-[A-Z0-9-]{5,60}$/.test(number) ||
      !/^(8801|01)[3-9]\d{8}$/.test(phone)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid order number and phone"
      });
    }

    const normalizedPhone = phone.startsWith("88")
      ? phone.slice(2)
      : phone;

    const order = await Order.findOne({
      orderNumber: number,
      "customer.phone": {
        $in: [normalizedPhone, "88" + normalizedPhone, "+" + "88" + normalizedPhone]
      }
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No matching order found"
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity
        })),
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        total: order.total,
        paymentMethod: order.paymentMethod
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
