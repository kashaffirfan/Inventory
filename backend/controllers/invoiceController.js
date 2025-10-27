import Invoice from "../models/Invoice.js";
import Counter from "../models/Counter.js";
import Cashier from "../models/Cashier.js";
import Product from "../models/Product.js"; 
import { jsPDF } from "jspdf";

export const getNextInvoice = async (req, res) => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "invoice", cashier: req.user.id },  // 👈 no "key", no "seq"
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    return res.json({ invoiceNo: counter.value });
  } catch (err) {
    console.error("getNextInvoice error:", err);
    return res.status(500).json({ message: "Server error getting next invoice number." });
  }
};


export const saveInvoice = async (req, res) => {
  try {
    if (req.user?.role !== "cashier") {
      return res.status(403).json({ message: "Only cashiers can create invoices." });
    }

    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Non-empty items are required." });
    }

    // Get next invoice number per cashier
    const counter = await Counter.findOneAndUpdate(
      { name: "invoice", cashier: req.user.id },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    const invoiceNo = counter.value;

    // cashier → manager lookup
    const cashier = await Cashier.findById(req.user.id).select("manager");
    if (!cashier) return res.status(404).json({ message: "Cashier not found." });

    // normalize items
    const normalizedItems = items.map((i) => {
      const qty = Number(i.quantity) || 0;
      const price = Number(i.price) || 0;
      return {
        name: i.product,
        quantity: qty,
        price,
        total: qty * price,
      };
    });
    const totalAmount = normalizedItems.reduce((s, i) => s + i.total, 0);

    // 🔻 Decrement stock for each product
    for (const i of normalizedItems) {
      const product = await Product.findOne({ name: i.name });
      if (product) {
        if (product.stock < i.quantity) {
          return res
            .status(400)
            .json({ message: `Not enough stock for product: ${i.name}` });
        }
        product.stock -= i.quantity;
        await product.save();
      }
    }

    // create invoice
    const created = await Invoice.create({
      invoiceNo,
      cashier: req.user.id,
      manager: cashier.manager,
      items: normalizedItems,
      totalAmount,
      createdAt: new Date(),
    });

    return res
      .status(201)
      .json({ message: "Invoice saved", invoiceId: created._id, invoiceNo });
  } catch (err) {
    console.error("saveInvoice error:", err);
    return res.status(500).json({ message: "Server error creating invoice." });
  }
};

export const exportInvoicePDF = async (req, res) => {
  try {
    const { invoiceNo, items, total } = req.body;
    const doc = new jsPDF();

    doc.text(`Invoice #${invoiceNo}`, 10, 10);
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, 20);
    doc.text("Items:", 10, 30);

    let y = 40;
    items.forEach((item, i) => {
      doc.text(`${i + 1}. ${item.product} x${item.quantity} = Rs.${item.price * item.quantity}`, 10, y);
      y += 10;
    });
    doc.text(`Total: Rs.${total}`, 10, y + 10);

    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listMyInvoices = async (req, res) => {
  try {
    if (req.user?.role !== "cashier") {
      return res.status(403).json({ message: "Only cashiers can view their invoices." });
    }

    const invoices = await Invoice.find({ cashier: req.user.id })
      .sort({ createdAt: -1 })
      .select("invoiceNo totalAmount items createdAt"); // light payload

    res.json(invoices);
  } catch (err) {
    console.error("listMyInvoices error:", err);
    res.status(500).json({ message: "Server error fetching invoices." });
  }
};
