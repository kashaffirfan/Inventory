import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Manager from "../models/Manager.js";
import Cashier from "../models/Cashier.js";
import User from "../models/User.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role)
    return res.status(400).json({ success: false, message: "All fields required." });

  try {
    let Model;
    if (role === "admin") Model = Admin;
    else if (role === "manager") Model = Manager;
    else if (role === "cashier") Model = Cashier;
    else if (role === "user") Model = User;
    else return res.status(400).json({ success: false, message: "Invalid role." });

    const account = await Model.findOne({ username });
    if (!account)
      return res.status(404).json({ success: false, message: "User not found." });

    // Admin may not use encrypted password
    const valid =
      role === "admin"
        ? password === account.password
        : await bcrypt.compare(password, account.password);

    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const token = jwt.sign(
      { id: account._id, role: role },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

export default router;
