import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientRequestId: {
    type: String,
    unique: true,
    sparse: true
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true },
    deliveryArea: {
      type: String,
      enum: ["inside", "outside"],
      required: true
    }
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["COD"],
    default: "COD"
  },
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled"
    ],
    default: "pending"
  },
  confirmedAt: Date,
  cancelledAt: Date
}, { timestamps: true });

orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
