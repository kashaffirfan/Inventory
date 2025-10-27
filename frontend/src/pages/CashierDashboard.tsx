import React, { useState, useEffect } from "react";
import axios from "axios";

interface Item {
  quantity: number;
  product: string;
  price: number;
}

const CashierDashboard: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Item>({ quantity: 1, product: "", price: 0 });
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [suggestions, setSuggestions] = useState<
    { _id: string; name: string; price: number }[]
  >([]);
  const [activeSection, setActiveSection] = useState("invoice");
  const [loadingInvNo, setLoadingInvNo] = useState(false);

  interface SavedItem { name: string; quantity: number; price: number; total: number; }
interface SavedInvoice {
  _id: string;
  invoiceNo: number;
  totalAmount: number;
  createdAt: string;
  items: SavedItem[];
}

const [myInvoices, setMyInvoices] = useState<SavedInvoice[]>([]);
const [historyOpen, setHistoryOpen] = useState<string | null>(null);
const fetchHistory = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/invoice/my", {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    });
    if (res.status >= 200 && res.status < 300 && Array.isArray(res.data)) {
      setMyInvoices(res.data);
    } else {
      console.error("History fetch unexpected:", res.status, res.data);
      setMyInvoices([]);
    }
  } catch (e) {
    console.error("Failed to fetch invoice history", e);
    setMyInvoices([]);
  }
};

useEffect(() => {
  if (activeSection === "history") {
    fetchHistory();
  }
}, [activeSection]);

  // --- Robust invoice number fetch with retry/backoff ---
  useEffect(() => {
    let cancelled = false;

    const fetchNextInvoice = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found — please log in again.");
        return;
      }

      setLoadingInvNo(true);

      // up to 2 attempts total
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await axios.get("http://localhost:5000/api/invoice/next", {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true,
          });

          if (cancelled) return;

          if (res.status >= 200 && res.status < 300 && res.data?.invoiceNo) {
            setInvoiceNo(String(res.data.invoiceNo));
            setLoadingInvNo(false);
            return;
          }

          console.error(
            `Unexpected response fetching invoice number (attempt ${attempt}):`,
            res.status,
            res.data
          );

          if (attempt === 2) {
            alert("Could not get invoice number from server. Please try again.");
            setLoadingInvNo(false);
            return;
          }

          // small backoff (400ms)
          await new Promise((r) => setTimeout(r, 400));
        } catch (err) {
          if (cancelled) return;
          console.error(`Failed to get next invoice id (attempt ${attempt}):`, err);

          if (attempt === 2) {
            alert("Server error getting next invoice number ❌");
            setLoadingInvNo(false);
            return;
          }

          // small backoff (400ms)
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    };

    fetchNextInvoice();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProductChange = async (value: string) => {
    setForm({ ...form, product: value });
    try {
      if (!value) return setSuggestions([]);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/products/search?q=${encodeURIComponent(value)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions(res.data);

      const exact = res.data.find(
        (p: any) => p.name.toLowerCase() === value.toLowerCase()
      );
      if (exact) {
        setForm((f) => ({ ...f, product: exact.name, price: exact.price }));
      }
    } catch (e) {
      console.error("Product search error", e);
    }
  };

  const handleAddItem = () => {
    if (!form.product) {
      alert("Please fill all fields");
      return;
    }
    setItems([...items, form]);
    setForm({ quantity: 1, product: "", price: 0 });
  };

  const totalBill = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const lineTotal = (form.price || 0) * (form.quantity || 0);

  const handleDone = async () => {
    try {
      if (!items.length) {
        alert("Please add at least one item before saving.");
        return;
      }

      // Ensure we have an invoice number (fallback: one quick fetch)
      let invNo = invoiceNo;
      if (!invNo) {
        const token = localStorage.getItem("token");
        const nextRes = await axios.get("http://localhost:5000/api/invoice/next", {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });
        if (nextRes.status < 200 || nextRes.status >= 300 || !nextRes.data?.invoiceNo) {
          alert("Could not get invoice number from server.");
          return;
        }
        invNo = String(nextRes.data.invoiceNo);
        setInvoiceNo(invNo);
      }

      const token = localStorage.getItem("token");
      const payload = {
        invoiceNo: Number(invNo),
        items: items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity),
          price: Number(i.price),
        })),
      };

      const res = await axios.post("http://localhost:5000/api/invoice", payload, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        alert("Invoice saved successfully ✅");
        setItems([]);
        setForm({ quantity: 1, product: "", price: 0 });
        return;
      }

      alert(res.data?.message || "Failed to save invoice");
    } catch (e: any) {
      console.error("Save invoice error:", e);
      alert(e?.response?.data?.message || "Failed to save invoice");
    }
  };

  // ✅ EXPORT: Generate PDF using backend
  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/invoice/export-pdf",
        { invoiceNo, items, total: totalBill },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Invoice_${invoiceNo || "draft"}.pdf`;
      link.click();
    } catch (e) {
      console.error("PDF export error", e);
      alert("Failed to export PDF ❌");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-10 text-center">Cashier Panel</h2>
        <nav className="flex-1 space-y-3">
          
          {["invoice", "history", "return"].map((menu) => (
            <button
              key={menu}
              onClick={() => setActiveSection(menu)}
              className={`w-full text-left px-4 py-2 rounded transition ${
                activeSection === menu ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
            >
              {menu.charAt(0).toUpperCase() + menu.slice(1)}
            </button>
          ))}
        </nav>
        <button className="mt-auto bg-red-600 px-4 py-2 rounded hover:bg-red-700">
          Logout
        </button>
      </div>
      {activeSection === "history" && (
  <>
    <h1 className="text-3xl font-bold mb-6">History</h1>

    <div className="bg-white p-6 rounded-lg shadow-md">
      {myInvoices.length === 0 ? (
        <p className="text-gray-600">No invoices yet.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Invoice #</th>
              <th className="p-2">Date</th>
              <th className="p-2">Items</th>
              <th className="p-2">Total</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {myInvoices.map((inv) => (
              <React.Fragment key={inv._id}>
                <tr className="border-b">
                  <td className="p-2">{inv.invoiceNo}</td>
                  <td className="p-2">{new Date(inv.createdAt).toLocaleString()}</td>
                  <td className="p-2">{inv.items?.length || 0}</td>
                  <td className="p-2">Rs.{(inv.totalAmount ?? 0).toFixed(2)}</td>
                  <td className="p-2">
                    <button
                      onClick={() => setHistoryOpen((o) => (o === inv._id ? null : inv._id))}
                      className="text-blue-600 hover:underline"
                    >
                      {historyOpen === inv._id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>

                {historyOpen === inv._id && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="p-3">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="text-left">
                              <th className="p-2">#</th>
                              <th className="p-2">Product</th>
                              <th className="p-2">Qty</th>
                              <th className="p-2">Price</th>
                              <th className="p-2">Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.items.map((it, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="p-2">{idx + 1}</td>
                                <td className="p-2">{it.name}</td>
                                <td className="p-2">{it.quantity}</td>
                                <td className="p-2">Rs.{it.price.toFixed(2)}</td>
                                <td className="p-2">Rs.{it.total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </>
)}


      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeSection === "invoice" && (
          <>
            <h1 className="text-3xl font-bold mb-6">Invoice Creation</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-gray-700">Quantity</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
                    className="border p-2 rounded"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-gray-700">Product</label>
                  <input
                    type="text"
                    placeholder="Search product"
                    value={form.product}
                    onChange={(e) => handleProductChange(e.target.value)}
                    list="product-suggestions"
                    className="border p-2 rounded"
                  />
                  <datalist id="product-suggestions">
                    {suggestions.map((p) => (
                      <option key={p._id} value={p.name}>
                        {`Name: ${p.name} — Price: Rs.${p.price}`}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-gray-700">Price</label>
                  <input
                    type="number"
                    placeholder="Enter price"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: +e.target.value })}
                    className="border p-2 rounded"
                  />
                </div>
              </div>

              <div className="text-right text-sm font-semibold mb-2">
                Line Total: Rs.{lineTotal.toFixed(2)}
              </div>

              <button
                onClick={handleAddItem}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>

            {/* Invoice Details */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Invoice Details</h2>
                <p className="text-gray-500 text-sm">
                  Invoice #: {loadingInvNo ? "Loading..." : invoiceNo || "—"}
                </p>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="p-2">Quantity</th>
                    <th className="p-2">Product</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">{item.product}</td>
                      <td className="p-2">Rs.{item.price.toFixed(2)}</td>
                      <td className="p-2">
                        Rs.{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right mt-4 text-xl font-bold">
                Total Bill: Rs.{totalBill.toFixed(2)}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleDone}
                  disabled={!items.length || loadingInvNo || !invoiceNo}
                  className={`px-4 py-2 rounded text-white ${
                    !items.length || loadingInvNo || !invoiceNo
                      ? "bg-green-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  Done
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={!items.length}
                  className={`px-4 py-2 rounded text-white ${
                    !items.length
                      ? "bg-purple-300 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  Export PDF
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;
