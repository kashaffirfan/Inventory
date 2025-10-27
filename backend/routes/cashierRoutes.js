// routes/cashierRoutes.js
import { Router } from "express";
import { getCashiersUnderManager } from "../controllers/managerController.js";
import verifyToken from "../verifyToken.js";          // must set req.user

const router = Router();

router.get("/manager", verifyToken, getCashiersUnderManager);

export default router;
