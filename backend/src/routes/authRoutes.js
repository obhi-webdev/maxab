import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { login, me } from "../controllers/authController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later."
  }
});

router.post("/login", loginLimiter, login);
router.get("/me", requireAdmin, me);

export default router;
