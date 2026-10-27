import { isValidObjectId } from "mongoose";
import Order from "../models/Order.js";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  createOrder,
  listOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

router.post("/", limiter, createOrder);
router.get("/admin/all", requireAdmin, listOrders);

// MAXAB_ADMIN_DELETE_ORDER
// Only authenticated administrators may delete orders.
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      message: "Order deleted permanently",
      data: {
        id: String(order._id),
        orderNumber: order.orderNumber
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
