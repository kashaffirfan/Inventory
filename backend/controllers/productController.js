import Product from "../models/Product.js";
import Cashier from "../models/Cashier.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import { parse } from "csv-parse/sync";
const upload = multer({ storage: multer.memoryStorage() });

export const uploadProductsCSV = [
  // multer middleware
  upload.single("file"),

  // actual handler
  async (req, res) => {
    try {
      // role guard (verifyToken me URL check hai; yahan explicit role bhi check kar lein)
      if (req.user?.role !== "manager") {
        return res.status(403).json({ message: "Only managers can upload CSV." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "CSV file is required." });
      }

      // parse CSV buffer
      const text = req.file.buffer.toString("utf-8");
      const rows = parse(text, {
        columns: true,        // use header row
        skip_empty_lines: true,
        trim: true,
      });

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "CSV is empty or invalid." });
      }

      // normalize + validate
      const docs = [];
      const errors = [];
      rows.forEach((r, idx) => {
        const line = idx + 2; // line 1 = headers
        const name = r.name?.toString().trim();
        const category = r.category?.toString().trim();
        const stock = Number(r.stock);
        const price = Number(r.price);

        if (!name || !category || Number.isNaN(stock) || Number.isNaN(price)) {
          errors.push(`Line ${line}: invalid row (needs name, category, stock, price)`);
          return;
        }

        docs.push({
          name,
          category,
          stock,
          price,
          addedBy: req.user.id, // Manager ObjectId
          createdAt: new Date(),
        });
      });

      if (!docs.length) {
        return res.status(400).json({ message: "No valid rows to insert.", errors });
      }

      // insert many
      const result = await Product.insertMany(docs, { ordered: false }).catch((e) => {
        // ordered:false means continue on errors; we still want a summary
        // `e.writeErrors` may contain duplicates etc.
        return { insertedCount: docs.length - (e.writeErrors?.length || 0), errors: e.writeErrors };
      });

      return res.status(201).json({
        message: `Uploaded ${result.insertedCount ?? docs.length} products`,
        invalidRows: errors.length ? errors : undefined,
      });
    } catch (err) {
      console.error("uploadProductsCSV error:", err);
      return res.status(500).json({ message: "Server error uploading CSV." });
    }
  },
];

// ➕ Add new product
export const addProduct = async (req, res) => {
  try {
    const { name, category, stock, price } = req.body;

    if (!name || !category || !stock || !price)
      return res.status(400).json({ message: "Please fill all required fields." });

    // 👇 Attach who added it (for manager)
    const addedBy = req.user?.id || null;

    const newProduct = new Product({
      name,
      category,
      stock,
      price,
      addedBy,
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 📄 Get all products
export const getAllProducts = async (req, res) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token and extract manager info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get only products added by this manager
    const products = await Product.find({ addedBy: decoded.id });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching manager products:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✏️ Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({ message: "✅ Product updated successfully!", product: updatedProduct });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Server error while updating product." });
  }
};

// ❌ Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({ message: "🗑️ Product deleted successfully!" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Server error while deleting product." });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const role = req.user?.role;
    const id = req.user?.id;
    const q = (req.query.q || "").toString().trim();

    if (!q) return res.json([]);

    let filter = { name: { $regex: q, $options: "i" } };

    if (role === "cashier") {
      const cashier = await Cashier.findById(id).select("manager");
      if (!cashier) return res.status(404).json({ message: "Cashier not found." });
      filter = { ...filter, addedBy: cashier.manager };
    } else if (role === "manager") {
      filter = { ...filter, addedBy: id };
    } else if (role === "admin") {
      // no extra restriction
    } else {
      return res.status(403).json({ message: "Unauthorized role." });
    }

    const products = await Product.find(filter)
      .select("_id name category price")
      .limit(10);

    res.json(products);
  } catch (err) {
    console.error("searchProducts error:", err);
    res.status(500).json({ message: "Server error searching products." });
  }
};

export const listPublicProducts = async (req, res) => {
  try {
    // Only in-stock items; return a lightweight projection
    const items = await Product.find({ stock: { $gt: 0 } })
      .select("_id name category stock price")
      .sort({ createdAt: -1 })
      .lean();

    console.log("[/products/public] count:", items.length);
    // Always return 200 with an array (even if empty)
    return res.status(200).json(items);
  } catch (e) {
    console.error("listPublicProducts error:", e);
    return res.status(500).json({ message: "Server error fetching products." });
  }
};
