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

router.use(requireAdmin);

router.get("/", listLandingPages);
router.post("/", createLandingPage);
router.get("/:id", getAdminLandingPage);
router.patch("/:id", updateLandingPage);
router.patch("/:id/status", changePublishStatus);
router.delete("/:id", deleteLandingPage);

export default router;
