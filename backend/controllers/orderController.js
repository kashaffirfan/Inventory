import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

/**
 * POST /api/orders/checkout
 * body: { items: [{ productId, qty }] }
 * role: user
 * - validates stock
 * - decrements stock atomically (transaction)
 * - creates order
 */
export const checkout = async (req, res) => {
  try {
    if (req.user?.role !== "user") {
      return res.status(403).json({ message: "Only users can checkout." });
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    // sanitize payload
    const normalized = items.map(i => ({
      productId: new mongoose.Types.ObjectId(String(i.productId)),
      qty: Math.max(1, Number(i.qty) || 0),
    }));

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const orderItems = [];
      let total = 0;

      for (const it of normalized) {
        // read product FOR UPDATE
        const product = await Product.findById(it.productId).session(session);
        if (!product) {
          throw new Error("Some product not found.");
        }
        if (product.stock < it.qty) {
          throw new Error(`Not enough stock for ${product.name} (available: ${product.stock}).`);
        }

        // decrement stock
        product.stock -= it.qty;
        await product.save({ session });

        const lineTotal = product.price * it.qty;
        total += lineTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          qty: it.qty,
          lineTotal,
        });
      }

      const order = await Order.create(
        [
          {
            user: req.user.id,
            items: orderItems,
            totalAmount: total,
            status: "placed",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: "Order placed successfully.",
        orderId: order[0]._id,
        totalAmount: total,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: err.message || "Checkout failed." });
    }
  } catch (err) {
    console.error("checkout error:", err);
    return res.status(500).json({ message: "Server error during checkout." });
  }
};

/**
 * GET /api/orders/my
 * role: user
 * - returns user's order history (latest first)
 */
export const myOrders = async (req, res) => {
  try {
    if (req.user?.role !== "user") {
      return res.status(403).json({ message: "Only users can view their orders." });
    }

    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("items totalAmount status createdAt");

    return res.json(orders);
  } catch (err) {
    console.error("myOrders error:", err);
    return res.status(500).json({ message: "Server error fetching orders." });
  }
};
