import mongoose from "mongoose";

const schema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  pageType: {
    type: String,
    enum: ["website", "landing"],
    required: true
  },
  pageKey: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    default: ""
  },
  device: {
    type: String,
    enum: ["mobile", "desktop", "tablet"],
    default: "desktop"
  },
  day: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  lastSeen: Date,
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  versionKey: false
});

schema.index(
  { day: 1, sessionId: 1, pageKey: 1 },
  { unique: true }
);

schema.index({ day: 1, pageType: 1, slug: 1 });

schema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model("VisitorAnalytics", schema);
