import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  History,
  ShoppingBag,
  ShoppingCart,
  RotateCcw,
  LogOut,
  Search,
  X,
} from "lucide-react";

type Product = {
  _id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
};

type CartItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

type TabKey = "history" | "buy" | "cart" | "return";

const UserDashboard: React.FC = () => {
  const [active, setActive] = useState<TabKey>("buy");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");

  // qty per product card
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const setCardQty = (id: string, v: number) =>
    setQtyMap((m) => ({ ...m, [id]: Math.max(1, v) }));

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem("cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Clear flash message on tab switch
  useEffect(() => {
    setMessage("");
  }, [active]);

  // Fetch products (only when BUY tab is active)
  useEffect(() => {
    if (active !== "buy") return;
    const ctl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/products/public", {
          signal: ctl.signal,
          validateStatus: () => true,
        });
        if (res.status >= 200 && res.status < 300 && Array.isArray(res.data)) {
          setProducts(res.data);
          setMessage("");
        } else {
          setProducts([]);
          setMessage(res.data?.message || `Failed to load products (status ${res.status}).`);
        }
      } catch (e) {
        if (!ctl.signal.aborted) {
          setProducts([]);
          setMessage("Failed to load products.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctl.abort();
  }, [active]);

  // Search filter (client-side)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [q, products]);

  // Map productId -> stock to enforce max qty when editing cart
  const stockMap = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const p of products) m[p._id] = p.stock;
    return m;
  }, [products]);

  // Cart helpers
  const addToCart = (p: Product, qty: number) => {
    qty = Math.max(1, Math.min(qty, p.stock));
    if (p.stock <= 0) {
      setMessage(`${p.name} is out of stock.`);
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === p._id);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = Math.min(next[idx].qty + qty, p.stock);
        next[idx] = { ...next[idx], qty: newQty };
        return next;
      }
      return [...prev, { productId: p._id, name: p.name, price: p.price, qty }];
    });
    setMessage(`${p.name} added to cart.`);
  };

  const updateQty = (productId: string, qty: number) => {
    const max = stockMap[productId] ?? Number.MAX_SAFE_INTEGER;
    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId
          ? { ...c, qty: Math.max(1, Math.min(qty, max)) }
          : c
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  // Sidebar menu
  const menuItems: { key: TabKey; name: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "history", name: "History", icon: <History /> },
    { key: "buy", name: "Buy", icon: <ShoppingBag /> },
    { key: "cart", name: "Cart", icon: <ShoppingCart />, badge: cartCount || undefined },
    { key: "return", name: "Return", icon: <RotateCcw /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    // optionally: localStorage.removeItem("cart");
    window.location.href = "/";
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      setMessage("Cart is empty!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/orders/checkout",
        {
          items: cart.map((c) => ({
            productId: c.productId,
            qty: c.qty,
          })),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, validateStatus: () => true }
      );
      if (res.status >= 200 && res.status < 300) {
        setMessage("Order placed successfully ✅");
        setCart([]);
        setActive("history"); // go to history after success
      } else {
        setMessage(res.data?.message || "Checkout failed");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Checkout failed");
    }
  };

  // --- Orders component (no product fetches here) ---
  const UserOrders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      const fetchOrders = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          const res = await axios.get("http://localhost:5000/api/orders/my", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            validateStatus: () => true,
          });
          if (res.status >= 200 && res.status < 300) setOrders(res.data || []);
          else setError(res.data?.message || "Failed to fetch orders.");
        } catch (e: any) {
          setError(e.response?.data?.message || "Failed to fetch orders.");
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }, []);

    if (loading) return <p>Loading your orders…</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!orders.length) return <p className="text-gray-600">No orders yet.</p>;

    return (
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="border rounded-lg p-4 hover:shadow transition">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold text-lg">Order #{order._id.slice(-6)}</h3>
              <span className="text-gray-500 text-sm">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="text-sm text-gray-700">
              Status:{" "}
              <span className={order.status === "placed" ? "text-green-600" : "text-yellow-600"}>
                {order.status}
              </span>
            </div>

            <ul className="mt-2 space-y-1 text-gray-700 text-sm">
              {order.items.map((i: any, idx: number) => (
                <li key={idx}>
                  {i.name} — {i.qty} × Rs.{i.price} = Rs.{i.lineTotal}
                </li>
              ))}
            </ul>

            <div className="mt-2 font-bold text-right">Total: Rs.{order.totalAmount}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="bg-blue-900 text-white w-64 p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-10">User Panel</h1>

        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg transition-colors ${
                active === item.key
                  ? "bg-blue-800 text-white"
                  : "text-gray-300 hover:bg-blue-800 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-5 h-5">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </span>
              {item.badge ? (
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-blue-800 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">User Dashboard</h1>

        {!!message && (
          <div className="mb-4 flex items-center justify-between bg-green-50 text-green-700 border border-green-200 rounded p-3">
            <span>{message}</span>
            <button onClick={() => setMessage("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* BUY */}
        {active === "buy" && (
          <>
            <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex items-center gap-3">
              <Search className="text-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products by name or category..."
                className="flex-1 outline-none"
              />
            </div>

            {loading ? (
              <div className="text-gray-600">Loading products…</div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-600">No products found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p) => {
                  const qv = qtyMap[p._id] ?? 1;
                  return (
                    <div key={p._id} className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-3">
                      <div className="flex justify-between">
                        <h2 className="text-lg font-semibold">{p.name}</h2>
                        <span className="text-blue-600 font-semibold">Rs.{p.price}</span>
                      </div>
                      <div className="text-sm text-gray-600">Category: {p.category}</div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Qty</label>
                        <input
                          type="number"
                          min={1}
                          max={p.stock}
                          value={qv}
                          onChange={(e) =>
                            setCardQty(p._id, Math.min(p.stock, Number(e.target.value || 1)))
                          }
                          className="w-24 border p-2 rounded"
                        />
                        <button
                          onClick={() => addToCart(p, qv)}
                          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          disabled={p.stock <= 0}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* CART */}
        {active === "cart" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Your Cart</h2>
              <button
                onClick={clearCart}
                disabled={!cart.length}
                className={`px-3 py-2 rounded text-white ${
                  cart.length ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
                }`}
              >
                Clear Cart
              </button>
            </div>

            {!cart.length ? (
              <div className="text-gray-600">Your cart is empty.</div>
            ) : (
              <>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-3 border-b">Product</th>
                      <th className="p-3 border-b">Price</th>
                      <th className="p-3 border-b">Qty</th>
                      <th className="p-3 border-b">Total</th>
                      <th className="p-3 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c) => (
                      <tr key={c.productId} className="hover:bg-gray-50">
                        <td className="p-3 border-b">{c.name}</td>
                        <td className="p-3 border-b">Rs.{c.price.toFixed(2)}</td>
                        <td className="p-3 border-b">
                          <input
                            type="number"
                            min={1}
                            value={c.qty}
                            onChange={(e) => updateQty(c.productId, Number(e.target.value || 1))}
                            className="w-20 border p-2 rounded"
                          />
                        </td>
                        <td className="p-3 border-b">Rs.{(c.price * c.qty).toFixed(2)}</td>
                        <td className="p-3 border-b">
                          <button
                            onClick={() => removeFromCart(c.productId)}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-right mt-4 text-xl font-bold">
                  Cart Total: Rs.{cartTotal.toFixed(2)}
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleCheckout}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* HISTORY */}
        {active === "history" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Order History</h2>
            <UserOrders />
          </div>
        )}

        {/* RETURN (placeholder) */}
        {active === "return" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Return</h2>
            <p className="text-gray-600">Return requests will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
