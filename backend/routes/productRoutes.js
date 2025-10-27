import express from "express";
import verifyToken from "../verifyToken.js";
import {
  addProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  searchProducts,
  uploadProductsCSV,
  listPublicProducts,
} from "../controllers/productController.js";

const router = express.Router();

// Manager-only CRUD
router.post("/add", verifyToken, addProduct);
router.get("/", verifyToken, getAllProducts);
router.put("/update/:id", verifyToken, updateProduct);
router.delete("/delete/:id", verifyToken, deleteProduct);

// Cashier/Manager search (protected)
router.get("/search", verifyToken, searchProducts);

// Manager CSV upload (protected)
router.post("/upload-csv", verifyToken, uploadProductsCSV);

// Public catalogue for users (NO token)
router.get("/public", listPublicProducts);

export default router;
