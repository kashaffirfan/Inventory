import Cashier from "../models/Cashier.js";

export const getCashiersByManager = async (req, res) => {
  try {
    // Make sure only manager can access this
    if (req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied" });
    }

    const managerId = req.user.id;
    const cashiers = await Cashier.find({ manager: managerId }).select("-password"); // exclude password

    res.status(200).json(cashiers);
  } catch (error) {
    console.error("Error fetching manager cashiers:", error);
    res.status(500).json({ message: "Server error" });
  }
};
