import express from "express";
import { loginAdmin } from "../controllers/adminController.js";
import { addPerson } from "../controllers/adminController.js";
import {
  listManagers,
  listCashiers,
  listUsers,
} from "../controllers/adminListController.js";
import verifyToken from "../verifyToken.js";              // ✅ add this

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/add-person", verifyToken, addPerson);
router.get("/managers", verifyToken, listManagers);
router.get("/cashiers", verifyToken, listCashiers);
router.get("/users", verifyToken, listUsers);


export default router;
