import { Router } from "express";
import ImageAsset from "../models/ImageAsset.js";
import multer from "multer";
import ImageKit, { toFile } from "@imagekit/nodejs";
import { fileTypeFromBuffer } from "file-type";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

router.post(
  "/product-image",
  requireAdmin,
  (req, res, next) => {
    upload.single("image")(req, res, err => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        return res.status(503).json({
          success: false,
          message: "ImageKit private key is not configured"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Select an image first"
        });
      }

      const type = await fileTypeFromBuffer(req.file.buffer);

      const allowed = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      };

      if (!type || !allowed[type.mime]) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG and WebP images are allowed"
        });
      }

      const client = new ImageKit({
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY
      });

      const fileName = `${randomUUID()}.${allowed[type.mime]}`;

      const result = await client.files.upload({
        file: await toFile(req.file.buffer, fileName),
        fileName,
        folder: "/MAXAB/products"
      });

      // Store exact ImageKit file ID for safe future deletion.
      // If the registry cannot be saved, leave the uploaded
      // file on ImageKit rather than losing its identity.
      await ImageAsset.create({
        url: result.url,
        fileId: result.fileId
      });

      return res.status(201).json({
        success: true,
        data: {
          url: result.url,
          fileId: result.fileId
        }
      });
    } catch (error) {
      console.error("ImageKit upload error:", error.name);

      return res.status(502).json({
        success: false,
        message: "Image upload failed. Check ImageKit configuration."
      });
    }
  }
);

export default router;
