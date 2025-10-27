import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: Number, required: true, unique: true },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: "Cashier", required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", required: true },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
      total: Number,
    },
  ],
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Invoice", invoiceSchema);
