import mongoose from "mongoose";

const imageAssetSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  fileId: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

export default mongoose.model("ImageAsset", imageAssetSchema);
