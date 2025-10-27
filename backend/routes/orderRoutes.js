import { Router } from "express";
import verifyToken from "../verifyToken.js";
import { checkout, myOrders } from "../controllers/orderController.js";

const router = Router();

// user-only
router.post("/checkout", verifyToken, checkout);
router.get("/my", verifyToken, myOrders);

export default router;
