import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  fileId: { type: String, default: "" },
  alt: { type: String, default: "" },
  position: { type: Number, default: 0 }
}, { _id: false });

const landingPageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },

  subtitle: { type: String, default: "" },
  description: { type: String, default: "" },
  features: { type: [String], default: [] },

  images: {
    type: [imageSchema],
    default: []
  },

  video: {
    url: { type: String, default: "" },
    fileId: { type: String, default: "" }
  },

  pricing: {
    regularPrice: { type: Number, default: 0, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT" }
  },

  delivery: {
    freeDelivery: { type: Boolean, default: false },
    insideDhaka: { type: Number, default: 70, min: 0 },
    outsideDhaka: { type: Number, default: 130, min: 0 },
    cashOnDelivery: { type: Boolean, default: true }
  },

  seo: {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" }
  },

  status: {
    type: String,
    enum: ["draft", "published", "unpublished"],
    default: "draft",
    index: true
  },

  publishedAt: { type: Date, default: null }
}, { timestamps: true });

landingPageSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("LandingPage", landingPageSchema);
