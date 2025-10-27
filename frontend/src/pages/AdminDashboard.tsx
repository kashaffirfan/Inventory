// AdminDashboard.tsx
import {
  UserCog,
  Users,
  FileText,
  LogOut,
  Briefcase,
  DollarSign,
  PlusCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Managers", icon: <Briefcase />, to: "/admin/managers" },
    { name: "Cashiers", icon: <DollarSign />, to: "/admin/cashiers" },
    { name: "Users", icon: <Users />, to: "/admin/users" },
    { name: "Ledger", icon: <FileText />, to: "/admin/ledger" },
    { name: "Profile", icon: <UserCog />, to: "/admin/profile" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleAddParty = () => {
    navigate("/add-party");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="bg-gray-900 text-white w-64 p-6 flex flex-col">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-center tracking-wide">Admin Panel</h1>
        </div>

        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.to)}
              className="w-full text-left flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleAddParty}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" />
            Add Party
          </button>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate("/admin/managers")}
            className="text-left bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Briefcase className="text-blue-500" /> Managers
            </h2>
            <p className="text-gray-600">Manage all store managers.</p>
          </button>

          <button
            onClick={() => navigate("/admin/cashiers")}
            className="text-left bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="text-green-500" /> Cashiers
            </h2>
            <p className="text-gray-600">Track cashier performance and sales.</p>
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="text-left bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Users className="text-yellow-500" /> Users
            </h2>
            <p className="text-gray-600">View and manage system users.</p>
          </button>

          {/* Keep the rest as-is */}
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <FileText className="text-purple-500" /> Ledger
            </h2>
            <p className="text-gray-600">View detailed financial records.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <UserCog className="text-pink-500" /> Profile
            </h2>
            <p className="text-gray-600">View and update your admin profile.</p>
          </div>
        </div>

        {/* ... keep your Recent Activities table ... */}
      </main>
    </div>
  );
};

export default AdminDashboard;
