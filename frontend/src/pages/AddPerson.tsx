import React, { useState } from "react";
import axios from "axios";
import { UserPlus, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AddPerson: React.FC = () => {
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [managerUsername, setManagerUsername] = useState(""); // 👈 Manager username field
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!role || !username || !password) {
      alert("Please fill all fields!");
      return;
    }

    if (role === "cashier" && !managerUsername) {
      alert("Please enter the manager username for this cashier!");
      return;
    }

    try {
      const payload: any = { role, username, password };

      if (role === "cashier") {
        payload.managerUsername = managerUsername;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized! Please log in again.");
        navigate("/");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/admin/add-person",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(response.data.message);
      // Reset form
      setRole("");
      setUsername("");
      setPassword("");
      setManagerUsername("");
      navigate("/admin");
    } catch (error: any) {
      console.error("Add Person Error:", error);
      alert(error.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-96">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <UserPlus className="w-8 h-8 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Add New Person</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Select */}
          <select
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select Role</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="user">User</option>
          </select>

          {/* Username */}
          <input
            type="text"
            placeholder="Username"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Manager Username (only for Cashier) */}
          {role === "cashier" && (
            <input
              type="text"
              placeholder="Manager Username"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
              value={managerUsername}
              onChange={(e) => setManagerUsername(e.target.value)}
            />
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Add {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Person"}
          </button>
        </form>

        {/* Back Button */}
        <button
          onClick={() => navigate("/admin")}
          className="mt-4 w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <Shield className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AddPerson;
