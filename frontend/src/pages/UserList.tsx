import React, { useEffect, useState } from "react";
import axios from "axios";

interface AppUser {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
}

const UserList: React.FC = () => {
  const [items, setItems] = useState<AppUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load users");
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      {items.length === 0 ? (
        <p className="text-gray-600">No users found.</p>
      ) : (
        <table className="w-full border-collapse bg-white rounded-xl shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border-b">Username</th>
              <th className="p-3 border-b">Role</th>
              <th className="p-3 border-b">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="p-3 border-b">{u.username}</td>
                <td className="p-3 border-b">{u.role}</td>
                <td className="p-3 border-b">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserList;
