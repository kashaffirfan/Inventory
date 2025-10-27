import express from "express";
import { getCashiersUnderManager } from "../controllers/managerController.js";
import verifyToken from "../verifyToken.js"; 

const router = express.Router();

router.get("/cashiers", verifyToken, getCashiersUnderManager);

export default router;
