import { Router } from "express";
import Product from "../models/Product.js";

const router = Router();
const SITE_URL = "https://maxproduct.shop";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlEntry(url, lastModified) {
  const lastmod = lastModified instanceof Date &&
    !Number.isNaN(lastModified.getTime())
      ? `<lastmod>${lastModified.toISOString().slice(0, 10)}</lastmod>`
      : "";

  return `<url><loc>${escapeXml(url)}</loc>${lastmod}</url>`;
}

router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      slug: { $type: "string", $ne: "" }
    })
      .select("slug updatedAt")
      .sort({ slug: 1 })
      .lean();

    if (products.length > 49999) {
      return res.status(503).type("text/plain").send(
        "Sitemap exceeds single-file URL limit"
      );
    }

    const entries = [
      xmlEntry(`${SITE_URL}/`),
      ...products.map(product => xmlEntry(
        `${SITE_URL}/product/${encodeURIComponent(product.slug)}`,
        product.updatedAt ? new Date(product.updatedAt) : null
      ))
    ];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      '</urlset>'
    ].join("\n");

    res.set("Cache-Control", "public, max-age=300");
    res.status(200).type("application/xml").send(xml);
  } catch (error) {
    next(error);
  }
});

export default router;
