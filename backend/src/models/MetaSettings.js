import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    default: "meta"
  },
  pixelId: {
    type: String,
    default: ""
  },
  encryptedToken: {
    type: String,
    default: "",
    select: false
  },
  enabled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("MetaSettings", schema);
