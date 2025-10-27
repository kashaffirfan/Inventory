import React, { useEffect, useState } from "react";
import axios from "axios";

interface Cashier {
  _id: string;
  username: string;
  manager?: string;     // manager ObjectId if you return it
  createdAt: string;
}

const CashierList: React.FC = () => {
  const [items, setItems] = useState<Cashier[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCashiers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/admin/cashiers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load cashiers");
      }
    };
    fetchCashiers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cashiers</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      {items.length === 0 ? (
        <p className="text-gray-600">No cashiers found.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded-xl shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border-b">Username</th>
              <th className="p-3 border-b">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="p-3 border-b">{c.username}</td>
                <td className="p-3 border-b">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CashierList;
