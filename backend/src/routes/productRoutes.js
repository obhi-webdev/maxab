import { Router } from "express";
import {
  listProducts,
  listAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", listProducts);
router.get("/admin/all", requireAdmin, listAdminProducts);
router.post("/", requireAdmin, createProduct);
router.patch("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
