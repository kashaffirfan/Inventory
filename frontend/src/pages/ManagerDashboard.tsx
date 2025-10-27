import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  User,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  _id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
}

interface Cashier {
  _id: string;
  username: string;
  createdAt: string;
}

interface Vendor {
  id: number;
  name: string;
  company: string;
  contact: string;
  location: string;
}

const ManagerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <Users />, link: "#" },
    { name: "Vendors", icon: <User />, link: "#" },
    { name: "Products", icon: <Package />, link: "#" },
    { name: "Sales", icon: <ShoppingBag />, link: "#" },
    { name: "Cashiers", icon: <DollarSign />, link: "#" },
  ];

  const vendors: Vendor[] = [
    { id: 1, name: "Ali Khan", company: "Alpha Traders", contact: "0300-1234567", location: "Lahore" },
    { id: 2, name: "Sara Ahmed", company: "Metro Supplies", contact: "0301-9876543", location: "Karachi" },
    { id: 3, name: "Usman Tariq", company: "City Wholesalers", contact: "0321-7654321", location: "Islamabad" },
    { id: 4, name: "Nida Malik", company: "Prime Distributors", contact: "0333-2221111", location: "Faisalabad" },
    { id: 5, name: "Bilal Hussain", company: "Global Traders", contact: "0345-8889999", location: "Multan" },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(res.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

const fetchCashiers = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/cashiers/manager", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCashiers(res.data);
  } catch (error: any) {
    console.error("Error fetching cashiers:", error?.response?.data || error);
  }
};


    fetchProducts();
    fetchCashiers();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="bg-gray-900 text-white w-64 p-6 flex flex-col">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-center tracking-wide">
            Manager Panel
          </h1>
        </div>

        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.link}
              className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </a>
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
      <main className="flex-1 p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <button
            onClick={() => navigate("/add-product")}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Products */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">All Products</h2>
          {products.length === 0 ? (
            <p className="text-gray-500">No products found.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 border-b">Name</th>
                  <th className="p-3 border-b">Category</th>
                  <th className="p-3 border-b">Stock</th>
                  <th className="p-3 border-b">Price</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{p.name}</td>
                    <td className="p-3 border-b">{p.category}</td>
                    <td className="p-3 border-b">{p.stock}</td>
                    <td className="p-3 border-b">${p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Cashiers */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Cashiers Under You</h2>
          {cashiers.length === 0 ? (
            <p className="text-gray-500">No cashiers assigned yet.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 border-b">Cashier Username</th>
                  <th className="p-3 border-b">Assigned On</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((cashier) => (
                  <tr key={cashier._id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{cashier.username}</td>
                    <td className="p-3 border-b">
                      {new Date(cashier.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Vendors */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Vendors List</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border-b">Vendor Name</th>
                <th className="p-3 border-b">Company</th>
                <th className="p-3 border-b">Contact</th>
                <th className="p-3 border-b">Location</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{vendor.name}</td>
                  <td className="p-3 border-b">{vendor.company}</td>
                  <td className="p-3 border-b">{vendor.contact}</td>
                  <td className="p-3 border-b">{vendor.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};
export default ManagerDashboard;
