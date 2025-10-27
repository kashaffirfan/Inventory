// backend/controllers/adminListController.js
import Manager from "../models/Manager.js";
import Cashier from "../models/Cashier.js";
import User from "../models/User.js";

export const listManagers = async (req, res) => {
  try {
    const managers = await Manager.find()
      .select("_id username createdAt")
      .sort({ createdAt: -1 });
    res.json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Server error fetching managers" });
  }
};

export const listCashiers = async (req, res) => {
  try {
    const cashiers = await Cashier.find()
      .select("_id username createdAt")
      .sort({ createdAt: -1 });
    res.json(cashiers);
  } catch (error) {
    console.error("Error fetching cashiers:", error);
    res.status(500).json({ message: "Server error fetching cashiers" });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("_id username role createdAt")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};
