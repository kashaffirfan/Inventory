import express from "express";
import {
  getAllUsers,
  addToCart,
  completePurchase,
  returnItem,
  getHistory,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", getAllUsers);                 // GET all users (admin)
router.post("/cart/add", addToCart);          // POST add item to cart
router.post("/purchase", completePurchase);   // POST complete purchase
router.post("/return", returnItem);           // POST return an item
router.get("/:userId/history", getHistory);   // GET user’s history

export default router;
