import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Manager from "../models/Manager.js";
import Cashier from "../models/Cashier.js";
import User from "../models/User.js";

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    // You said “no encryption” for now, so plain compare:
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Sign a JWT that includes id, username, role
    const token = jwt.sign(
      { id: admin._id.toString(), username: admin.username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,                                    // ✅ return token
      admin: { id: admin._id, username: admin.username },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const addPerson = async (req, res) => {
  try {
    const { role, username, password, managerUsername } = req.body;

    // ✅ Who is calling?
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: missing admin id in token." });
    }

    // ✅ Optional: fetch admin username for auditing
    const adminDoc = await Admin.findById(adminId).select("username");
    const createdByAdmin = adminDoc?.username || "system";

    if (!role || !username || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "manager") {
      const exists = await Manager.findOne({ username });
      if (exists) return res.status(409).json({ message: "Manager username already exists." });

      await Manager.create({
        username,
        password: hashedPassword,
        role: "manager",
        createdByAdmin,                // keep if your schema has it
      });
      return res.status(201).json({ message: "Manager added successfully!" });
    }

    if (role === "cashier") {
      if (!managerUsername) {
        return res
          .status(400)
          .json({ message: "Manager username is required for cashier." });
      }

      // ✅ Translate managerUsername -> manager ObjectId
      const mgr = await Manager.findOne({ username: managerUsername }).select("_id username");
      if (!mgr) return res.status(404).json({ message: "Manager not found." });

      const exists = await Cashier.findOne({ username });
      if (exists) return res.status(409).json({ message: "Cashier username already exists." });

      await Cashier.create({
        username,
        password: hashedPassword,
        role: "cashier",
        manager: mgr._id,              // ✅ store ObjectId (matches your DB)
        createdByAdmin,                // optional
      });

      return res.status(201).json({ message: "Cashier added successfully!" });
    }

    if (role === "user") {
      const exists = await User.findOne({ username });
      if (exists) return res.status(409).json({ message: "User username already exists." });

      await User.create({
        username,
        password: hashedPassword,
        role: "user",
        createdByAdmin,
      });

      return res.status(201).json({ message: "User added successfully!" });
    }

    return res.status(400).json({ message: "Invalid role provided." });
  } catch (error) {
    console.error("Add Person Error:", error);
    res.status(500).json({ message: "Server error while adding person." });
  }
};

export const listManagers = async (_req, res) => {
  const items = await Manager.find().select("_id username createdAt").sort({ createdAt: -1 });
  res.json(items);
};

export const listCashiers = async (_req, res) => {
  const items = await Cashier.find().select("_id username createdAt").sort({ createdAt: -1 });
  res.json(items);
};

export const listUsers = async (_req, res) => {
  const items = await User.find().select("_id username role createdAt").sort({ createdAt: -1 });
  res.json(items);
};
