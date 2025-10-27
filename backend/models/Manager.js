import mongoose from "mongoose";

const managerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "manager" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Manager", managerSchema);
