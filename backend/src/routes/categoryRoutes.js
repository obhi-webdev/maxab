import { Router } from "express";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

function validate(body) {
  const name = String(body?.name || "").trim();
  const slug = String(body?.slug || "").trim().toLowerCase();
  const description = String(body?.description || "").trim();
  const image = String(body?.image || "").trim();
  const sortOrder = Number(body?.sortOrder ?? 0);

  if (name.length < 2 || name.length > 100)
    throw new Error("Category name must be 2–100 characters");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new Error("Invalid category slug");

  if (description.length > 500)
    throw new Error("Description is too long");

  if (image && (
    image.length > 2048 ||
    !/^https:\/\//i.test(image)
  )) throw new Error("Image must use an HTTPS URL");

  if (!Number.isInteger(sortOrder) || sortOrder < 0)
    throw new Error("Invalid display order");

  if (typeof body?.isActive !== "boolean")
    throw new Error("Active status must be true or false");

  return {
    name,
    slug,
    description,
    image,
    sortOrder,
    isActive: body.isActive
  };
}

function invalid(res, error) {
  return res.status(400).json({
    success: false,
    message: error.message
  });
}

// Public categories
router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// Protected complete category list
router.get("/admin/all", requireAdmin, async (req, res, next) => {
  try {
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// Create
router.post("/", requireAdmin, async (req, res, next) => {
  let data;
  try {
    data = validate(req.body);
  } catch (error) {
    return invalid(res, error);
  }

  try {
    const category = await Category.create(data);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// Update
router.patch("/:id", requireAdmin, async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID"
    });
  }

  let data;
  try {
    data = validate(req.body);
  } catch (error) {
    return invalid(res, error);
  }

  try {
    const old = await Category.findById(req.params.id);

    if (!old) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Product category uses the name, so prevent renaming
    // while products still reference the current name.
    if (old.name !== data.name) {
      const count = await Product.countDocuments({
        category: old.name
      });

      if (count) {
        return res.status(409).json({
          success: false,
          message: "Move products to another category before renaming"
        });
      }
    }

    Object.assign(old, data);
    await old.save();

    res.json({ success: true, data: old });
  } catch (error) {
    next(error);
  }
});

// Delete only unused categories
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const count = await Product.countDocuments({
      category: category.name
    });

    if (count) {
      return res.status(409).json({
        success: false,
        message: "Category contains products. Move them first."
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted"
    });
  } catch (error) {
    next(error);
  }
});

export default router;
