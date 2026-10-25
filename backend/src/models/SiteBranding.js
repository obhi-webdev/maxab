import mongoose from "mongoose";

const siteBrandingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "main",
      unique: true
    },
    logoUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model(
  "SiteBranding",
  siteBrandingSchema
);
