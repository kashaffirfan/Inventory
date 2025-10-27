import React, { useEffect, useState } from "react";
import axios from "axios";

interface Manager {
  _id: string;
  username: string;
  createdAt: string;
}

const ManagerList: React.FC = () => {
  const [items, setItems] = useState<Manager[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/admin/managers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load managers");
      }
    };
    fetchManagers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Managers</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      {items.length === 0 ? (
        <p className="text-gray-600">No managers found.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded-xl shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border-b">Username</th>
              <th className="p-3 border-b">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map(m => (
              <tr key={m._id} className="hover:bg-gray-50">
                <td className="p-3 border-b">{m.username}</td>
                <td className="p-3 border-b">{new Date(m.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManagerList;
