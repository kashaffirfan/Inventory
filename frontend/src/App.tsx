import { BrowserRouter, Routes, Route } from "react-router-dom";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import LoginPage from "./pages/Login";
import AddPerson from "./pages/AddPerson";
import AddProduct from "./pages/AddProduct";
import ManagerList from "./pages/ManagerList";
import CashierList from "./pages/CashierList";
import UserList from "./pages/UserList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/cashier" element={<CashierDashboard />} />
        <Route path="/add-party" element={<AddPerson/>} />
        <Route path="/add-product" element={<AddProduct/>} />
        <Route path="/admin/managers" element={<ManagerList />} />
        <Route path="/admin/cashiers" element={<CashierList />} />
        <Route path="/admin/users" element={<UserList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
