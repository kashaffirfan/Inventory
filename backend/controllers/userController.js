import User from "../models/User.js";

// 🧾 Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// 🛒 Add item to user's cart
export const addToCart = async (req, res) => {
  const { userId, item } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cart.push(item);
    await user.save();

    res.status(200).json({ message: "Item added to cart", cart: user.cart });
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart", error: err.message });
  }
};

// 💳 Complete a purchase
export const completePurchase = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.cart.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    const totalAmount = user.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    user.history.push({ items: user.cart, totalAmount });
    user.cart = [];

    await user.save();
    res.status(200).json({ message: "Purchase completed", history: user.history });
  } catch (err) {
    res.status(500).json({ message: "Error completing purchase", error: err.message });
  }
};

// 🔁 Return an item
export const returnItem = async (req, res) => {
  const { userId, productId, reason, refundedAmount } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.returns.push({ productId, reason, refundedAmount });
    await user.save();

    res.status(200).json({ message: "Item returned successfully", returns: user.returns });
  } catch (err) {
    res.status(500).json({ message: "Error returning item", error: err.message });
  }
};

// 📜 Get user's history
export const getHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select("history returns cart name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history", error: err.message });
  }
};
