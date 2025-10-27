import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name:    { type: String, required: true },
    price:   { type: Number, required: true },
    qty:     { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items:  { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["placed","cancelled","refunded"], default: "placed" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
