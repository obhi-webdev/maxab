import mongoose from "mongoose";
import Product from "../models/Product.js";

const fields = [
  "name", "slug", "category", "description",
  "price", "oldPrice", "images", "stock",
  "featured", "isActive"
];

function pickFields(body) {
  const result = {};

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field];
    }
  }

  if (typeof result.slug === "string") {
    result.slug = result.slug.trim().toLowerCase();
  }

  return result;
}

function validate(data, partial = false) {
  const required = ["name", "slug", "category", "price"];

  if (!partial && required.some(key => data[key] === undefined)) {
    return "Name, slug, category and price are required";
  }

  for (const key of ["name", "slug", "category"]) {
    if (data[key] !== undefined &&
        (typeof data[key] !== "string" || !data[key].trim())) {
      return `${key} must be a non-empty string`;
    }
  }

  if (data.slug !== undefined &&
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    return "Slug must use lowercase letters, numbers and hyphens";
  }

  if (data.description !== undefined &&
      typeof data.description !== "string") {
    return "Description must be text";
  }

  for (const key of ["price", "oldPrice", "stock"]) {
    if (data[key] !== undefined &&
        (typeof data[key] !== "number" ||
         !Number.isFinite(data[key]) ||
         data[key] < 0)) {
      return `${key} must be a non-negative number`;
    }
  }

  if (data.stock !== undefined && !Number.isInteger(data.stock)) {
    return "Stock must be a whole number";
  }

  if (data.images !== undefined &&
      (!Array.isArray(data.images) ||
       data.images.length > 12 ||
       !data.images.every(url =>
         typeof url === "string" &&
         url.length <= 2048 &&
         /^https:\/\//i.test(url)
       ))) {
    return "Images must be an array of HTTPS image URLs (maximum 12)";
  }

  for (const key of ["featured", "isActive"]) {
    if (data[key] !== undefined &&
        typeof data[key] !== "boolean") {
      return `${key} must be true or false`;
    }
  }

  return null;
}

export async function listProducts(req, res, next) {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

export async function listAdminProducts(req, res, next) {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const data = pickFields(req.body || {});
    const error = validate(data);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    const product = await Product.create(data);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const data = pickFields(req.body || {});
    const error = validate(data, true);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product deleted"
    });
  } catch (error) {
    next(error);
  }
}
