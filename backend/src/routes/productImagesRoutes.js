import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { images } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    if (
      !Array.isArray(images) ||
      images.length > 12 ||
      !images.every(url => {
        if (typeof url !== "string" || url.length > 2048) {
          return false;
        }
        try {
          const parsed = new URL(url);
          return parsed.protocol === "https:" &&
            !!parsed.hostname &&
            !parsed.username &&
            !parsed.password;
        } catch {
          return false;
        }
      }) ||
      new Set(images).size !== images.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide up to 12 unique HTTPS image URLs"
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { images } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product gallery updated",
      data: {
        id: product._id,
        images: product.images
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
