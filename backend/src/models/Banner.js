import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "",
    trim: true,
    maxlength: 120
  },
  subtitle: {
    type: String,
    default: "",
    maxlength: 250
  },
  image: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: "Shop Now",
    maxlength: 40
  },
  buttonLink: {
    type: String,
    default: "/#shop"
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model("Banner", bannerSchema);
