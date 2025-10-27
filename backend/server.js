import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import managerRoutes from "./routes/managerRoutes.js";
import cashierRoutes from "./routes/cashierRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/cashiers", cashierRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/orders", orderRoutes);


// MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
