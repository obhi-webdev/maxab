import { Router } from "express";
import SiteBranding from "../models/SiteBranding.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public: website logo
router.get("/public", async (req, res, next) => {
  try {
    const branding = await SiteBranding.findOne({
      key: "main"
    });

    res.json({
      success: true,
      data: {
        logoUrl: branding?.logoUrl || "",
        faviconUrl: branding?.faviconUrl || ""
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: load logo settings
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const branding = await SiteBranding.findOne({
      key: "main"
    });

    res.json({
      success: true,
      data: {
        logoUrl: branding?.logoUrl || "",
        faviconUrl: branding?.faviconUrl || ""
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: save logo
router.put("/", requireAdmin, async (req, res, next) => {
  try {
    const { logoUrl } = req.body || {};

    if (
      typeof logoUrl !== "string" ||
      logoUrl.length > 2048 ||
      (logoUrl &&
        (!logoUrl.startsWith("https://") ||
         !/^https:\/\/[^/\s]+\/\S+$/i.test(logoUrl)))
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid HTTPS logo URL is required"
      });
    }

    const branding = await SiteBranding.findOneAndUpdate(
      { key: "main" },
      { $set: { logoUrl } },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: "Website logo updated",
      data: {
        logoUrl: branding.logoUrl
      }
    });
  } catch (error) {
    next(error);
  }
});


// Admin: save or remove favicon
router.put("/favicon", requireAdmin, async (req, res, next) => {
  try {
    const { faviconUrl } = req.body || {};

    if (
      typeof faviconUrl !== "string" ||
      faviconUrl.length > 2048 ||
      (faviconUrl &&
        (!faviconUrl.startsWith("https://") ||
         !/^https:\/\/[^/\s]+\/\S+$/i.test(faviconUrl)))
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid HTTPS favicon URL is required"
      });
    }

    const branding = await SiteBranding.findOneAndUpdate(
      { key: "main" },
      { $set: { faviconUrl } },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: faviconUrl ? "Favicon saved" : "Favicon removed",
      data: {
        faviconUrl: branding.faviconUrl || ""
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
