import { Router } from "express";
import StoreSettings from "../models/StoreSettings.js";
import { getDeliverySettings } from "../services/deliverySettings.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/delivery", async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await getDeliverySettings()
    });
  } catch (error) {
    next(error);
  }
});

router.put("/delivery", requireAdmin, async (req, res, next) => {
  try {
    const { inside, outside } = req.body || {};

    const valid = value =>
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 1000;

    if (!valid(inside) || !valid(outside)) {
      return res.status(400).json({
        success: false,
        message: "Delivery charges must be whole numbers from 0 to 1000"
      });
    }

    const settings = await StoreSettings.findOneAndUpdate(
      { key: "delivery" },
      {
        $set: { inside, outside }
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
        inside: settings.inside,
        outside: settings.outside
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
