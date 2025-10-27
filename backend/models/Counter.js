import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name:    { type: String, required: true }, // "invoice"
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: "Cashier", required: true },
  value:   { type: Number, default: 0 },
});

counterSchema.index({ name: 1, cashier: 1 }, { unique: true });

export default mongoose.model("Counter", counterSchema);
