import { Router } from "express";
import crypto from "node:crypto";

import MetaSettings from "../models/MetaSettings.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

function getKey() {
  const value = process.env.META_SETTINGS_ENCRYPTION_KEY;

  if (!/^[a-f0-9]{64}$/i.test(value || "")) {
    throw new Error("Meta encryption key is not configured");
  }

  return Buffer.from(value, "hex");
}

function encryptToken(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getKey(),
    iv
  );

  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64")
  ].join(".");
}

function safeSettings(settings) {
  return {
    pixelId: settings?.pixelId || "",
    enabled: Boolean(settings?.enabled),
    tokenConfigured: Boolean(settings?.encryptedToken)
  };
}

// Public: Pixel ID only, never the token
router.get("/public", async (req, res, next) => {
  try {
    const settings = await MetaSettings.findOne({
      key: "meta"
    }).select("pixelId enabled");

    res.json({
      success: true,
      data: {
        pixelId: settings?.enabled ? settings.pixelId : "",
        enabled: Boolean(settings?.enabled)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: masked configuration
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const settings = await MetaSettings
      .findOne({ key: "meta" })
      .select("+encryptedToken");

    res.json({
      success: true,
      data: safeSettings(settings)
    });
  } catch (error) {
    next(error);
  }
});

// Admin: save settings
router.put("/", requireAdmin, async (req, res, next) => {
  try {
    const { pixelId, accessToken, enabled } = req.body || {};

    if (
      typeof pixelId !== "string" ||
      (pixelId && !/^\d{10,25}$/.test(pixelId)) ||
      typeof enabled !== "boolean" ||
      (accessToken !== undefined &&
        (typeof accessToken !== "string" ||
         accessToken.length > 4096))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Meta Pixel settings"
      });
    }

    const current = await MetaSettings.findOne({
      key: "meta"
    }).select("+encryptedToken");

    const updated = {
      pixelId,
      enabled
    };

    if (accessToken?.trim()) {
      updated.encryptedToken = encryptToken(
        accessToken.trim()
      );
    }

    const hasToken = Boolean(
      updated.encryptedToken || current?.encryptedToken
    );

    if (enabled && (!pixelId || !hasToken)) {
      return res.status(400).json({
        success: false,
        message: "Pixel ID and Access Token required to enable CAPI"
      });
    }

    const settings = await MetaSettings.findOneAndUpdate(
      { key: "meta" },
      { $set: updated },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    ).select("+encryptedToken");

    res.json({
      success: true,
      message: "Meta tracking settings saved",
      data: safeSettings(settings)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
