// controllers/managerController.js
import Cashier from "../models/Cashier.js";

export const getCashiersUnderManager = async (req, res) => {
  try {
    const managerId = req.user?.id;
    if (!managerId) {
      return res.status(400).json({ message: "Manager id missing in token." });
    }

    const cashiers = await Cashier
      .find({ manager: managerId })
      .select("username createdAt _id")
      .sort({ createdAt: -1 });

    res.json(cashiers);
  } catch (error) {
    console.error("Error fetching cashiers:", error);
    res.status(500).json({ message: "Server error while fetching cashiers." });
  }
};
