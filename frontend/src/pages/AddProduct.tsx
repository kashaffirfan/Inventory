import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: "",
    price: "",
  });
  const [message, setMessage] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null); // ⬅️ moved here
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/products/add",
        {
          name: formData.name,
          category: formData.category,
          stock: Number(formData.stock),
          price: Number(formData.price),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(response.data.message || "Product added ✅");
      setFormData({ name: "", category: "", stock: "", price: "" });

      setTimeout(() => {
        navigate(-1);
        // or: navigate("/manager-dashboard");
      }, 1200);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Failed to add product");
    }
  };

  // ⬇️ CSV upload handler (outside handleSubmit)
  const handleCsvUpload = async () => {
    if (!csvFile) {
      alert("Please choose a CSV file first.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("file", csvFile);

      const res = await axios.post(
        "http://localhost:5000/api/products/upload-csv",
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );

      if (res.status >= 200 && res.status < 300) {
        setMessage(res.data.message || "CSV uploaded ✅");
        setCsvFile(null);
        // optionally: navigate(-1);
      } else {
        setMessage(res.data?.message || "CSV upload failed");
      }
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "CSV upload failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Add New Product</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Product Name"
            className="w-full border p-3 rounded-lg"
            required
          />
          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="Category"
            className="w-full border p-3 rounded-lg"
            required
          />
          <input
            name="stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
            placeholder="Stock Quantity"
            className="w-full border p-3 rounded-lg"
          />
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="Price"
            className="w-full border p-3 rounded-lg"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
          >
            Add Product
          </button>
        </form>

        {/* ---- OR Upload via CSV ---- */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold mb-2">Upload CSV (multiple products)</h2>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="w-full border p-3 rounded-lg"
          />
          <button
            onClick={handleCsvUpload}
            className="mt-3 w-full bg-gray-800 text-white p-3 rounded-lg hover:bg-gray-900 transition"
          >
            Upload CSV
          </button>

          <p className="text-xs text-gray-500 mt-2">
            CSV headers must be: <b>name,category,stock,price</b>
          </p>
        </div>

        {message && <p className="mt-4 text-center text-green-600">{message}</p>}
      </div>
    </div>
  );
};

export default AddProduct;
