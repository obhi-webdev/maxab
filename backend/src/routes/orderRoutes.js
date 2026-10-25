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
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
