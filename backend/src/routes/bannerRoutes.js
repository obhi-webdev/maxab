import { Router } from "express";
import mongoose from "mongoose";
import Banner from "../models/Banner.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

function validate(body) {
  const title = String(body?.title || "").trim();
  const subtitle = String(body?.subtitle || "").trim();
  const image = String(body?.image || "").trim();
  const buttonText = String(body?.buttonText || "Shop Now").trim();
  const buttonLink = String(body?.buttonLink || "/#shop").trim();
  const sortOrder = Number(body?.sortOrder ?? 0);

  if (title.length > 120 ||
      subtitle.length > 250 ||
      !/^https:\/\/[^ ]{1,2040}$/i.test(image) ||
      !buttonText || buttonText.length > 40 ||
      !/^\/(?!\/)[a-zA-Z0-9/#?=&%._-]*$/.test(buttonLink) ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 || sortOrder > 10000 ||
      typeof body?.isActive !== "boolean") {
    throw new Error("Invalid banner information");
  }

  return {
    title, subtitle, image, buttonText,
    buttonLink, sortOrder, isActive: body.isActive
  };
}

router.get("/", async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/all", requireAdmin, async (req, res, next) => {
  try {
    const banners = await Banner.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = validate(req.body);
    const banner = await Banner.create(data);
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    if (error.message === "Invalid banner information") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID"
      });
    }

    const data = validate(req.body);

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    if (error.message === "Invalid banner information") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID"
      });
    }

    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    res.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
