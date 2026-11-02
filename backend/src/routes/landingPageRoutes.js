import { rateLimit } from "express-rate-limit";
import {
  createLandingOrder,
  listLandingOrders,
  changeLandingOrderStatus
} from "../controllers/landingOrderController.js";
import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";

import {
  createLandingPage,
  listLandingPages,
  getAdminLandingPage,
  updateLandingPage,
  changePublishStatus,
  deleteLandingPage,
  getPublicLandingPage
} from "../controllers/landingPageController.js";

const router = Router();

router.get("/public/:slug", getPublicLandingPage);

const landingOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

router.post(
  "/public/:slug/orders",
  landingOrderLimiter,
  createLandingOrder
);


router.use(requireAdmin);
router.get("/orders/admin", listLandingOrders);
router.patch("/orders/:id/status", changeLandingOrderStatus);


router.get("/", listLandingPages);
router.post("/", createLandingPage);
router.get("/:id", getAdminLandingPage);
router.patch("/:id", updateLandingPage);
router.patch("/:id/status", changePublishStatus);
router.delete("/:id", deleteLandingPage);

export default router;
