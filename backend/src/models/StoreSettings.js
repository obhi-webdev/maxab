import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  inside: {
    type: Number,
    required: true,
    min: 0,
    max: 1000
  },
  outside: {
    type: Number,
    required: true,
    min: 0,
    max: 1000
  }
}, { timestamps: true });

export default mongoose.model("StoreSettings", schema);
