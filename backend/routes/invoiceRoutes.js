import express from "express";
import verifyToken from "../verifyToken.js";
import {
  saveInvoice,
  exportInvoicePDF,
  getNextInvoice,
  listMyInvoices
} from "../controllers/invoiceController.js";

const router = express.Router();

// ✅ Only use the controller routes once
router.get("/next", verifyToken, getNextInvoice);
router.post("/", verifyToken, saveInvoice);
router.post("/export-pdf", verifyToken, exportInvoicePDF);
router.get("/my", verifyToken, listMyInvoices);


export default router;
