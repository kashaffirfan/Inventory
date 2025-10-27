// models/Cashier.js
import mongoose from "mongoose";

const cashierSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "cashier" },

    // ✅ Use ObjectId relation to Manager (matches your DB doc)
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", required: true },

    // (optional) keep these only if you actually use them; make them optional to avoid breaking existing docs
    managerUsername: { type: String },    // deprecated
    createdByAdmin: { type: String },     // optional unless you truly require this
  },
  { timestamps: true }
);

// Avoid model overwrite errors during dev restarts
export default mongoose.models.Cashier || mongoose.model("Cashier", cashierSchema);
