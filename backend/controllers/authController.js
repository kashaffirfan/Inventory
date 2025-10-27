// authController.js (login)
import jwt from "jsonwebtoken";

const token = jwt.sign(
  { id: manager._id.toString(), username: manager.username, role: "manager" },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
