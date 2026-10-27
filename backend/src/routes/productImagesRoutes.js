import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Banner from "../models/Banner.js";
import SiteBranding from "../models/SiteBranding.js";
import ImageAsset from "../models/ImageAsset.js";
import ImageKit from "@imagekit/nodejs";
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

    const previous = await Product.findById(id);

    if (!previous) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const removed = previous.images.filter(
      url => !images.includes(url)
    );

    // Save the product gallery first.
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { images } },
      { new: true, runValidators: true }
    );

    const deletedFromImageKit = [];
    const deleteWarnings = [];

    for (const url of removed) {
      // Legacy/untracked or external URLs must not be deleted.
      const asset = await ImageAsset.findOne({ url });
      if (!asset) {
        deleteWarnings.push(
          "Image removed from gallery, but storage deletion " +
          "was skipped because its ImageKit file ID is not registered."
        );
        continue;
      }

      // Do not delete images still used anywhere on the site.
      const [
        usedByProduct,
        usedByCategory,
        usedByBanner,
        usedByBranding
      ] = await Promise.all([
        Product.exists({ images: url }),
        Category.exists({ image: url }),
        Banner.exists({ image: url }),
        SiteBranding.exists({ logoUrl: url })
      ]);

      if (
        usedByProduct ||
        usedByCategory ||
        usedByBanner ||
        usedByBranding
      ) {
        deleteWarnings.push(
          "Image retained in ImageKit because it is " +
          "still referenced elsewhere."
        );
        continue;
      }

      if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        deleteWarnings.push(
          "ImageKit deletion skipped: private key missing."
        );
        continue;
      }

      try {
        const client = new ImageKit({
          privateKey: process.env.IMAGEKIT_PRIVATE_KEY
        });

        await client.files.delete(asset.fileId);

        await ImageAsset.deleteOne({ _id: asset._id });
        deletedFromImageKit.push(url);
      } catch (error) {
        console.error(
          "ImageKit delete failed:",
          error.name,
          error.message
        );

        deleteWarnings.push(
          "Image removed from gallery, but ImageKit " +
          "deletion failed. The file may need manual cleanup."
        );
      }
    }

    res.json({
      success: true,
      message: "Product gallery updated",
      data: {
        id: product._id,
        images: product.images,
        deletedFromImageKit,
        deleteWarnings
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
