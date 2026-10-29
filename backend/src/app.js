import sitemapRoutes from "./routes/sitemapRoutes.js";
import siteBrandingRoutes from "./routes/siteBrandingRoutes.js";
import metaSettingsRoutes from "./routes/metaSettingsRoutes.js";
import productImagesRoutes from "./routes/productImagesRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://maxab-frontend.onrender.com",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map(value => value.trim().replace(/\/$/, ""))
    .filter(Boolean)
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MAXAB API is running",
    database: "connected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sitemap.xml", sitemapRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/track-order", trackingRoutes);

app.use("/api/categories", categoryRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/admin/product-images", productImagesRoutes);
app.use("/api/meta-settings", metaSettingsRoutes);
app.use("/api/site-branding", siteBrandingRoutes);
app.use(errorHandler);

export default app;
