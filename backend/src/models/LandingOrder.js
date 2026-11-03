import mongoose from "mongoose";

const landingOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  clientRequestId: { type: String, required: true, unique: true },
  landingPage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LandingPage",
    required: true
  },
  pageSlug: { type: String, required: true },
  productTitle: { type: String, required: true },
  productImage: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1, max: 10 },
  unitPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryCharge: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, required: true },
    deliveryArea: {
      type: String,
      enum: ["inside", "outside"],
      required: true
    }
  },
  paymentMethod: {
    type: String,
    enum: ["COD"],
    default: "COD"
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "hold"],
    default: "pending"
  }
}, { timestamps: true });

landingOrderSchema.index({ createdAt: -1 });

export default mongoose.model("LandingOrder", landingOrderSchema);
