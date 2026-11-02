import { useEffect, useState } from "react";

const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

const money = n => `৳${Number(n || 0).toLocaleString("en-BD")}`;

function token() {
  return sessionStorage.getItem("MAXPRODUCT-admin-token") ||
    localStorage.getItem("MAXPRODUCT-admin-token") || "";
}

export default function LandingOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  async function load() {
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/landing-pages/orders/admin`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load orders");
      }

      setOrders(result.data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(order, status) {
    if (status === order.status) return;

    if (!window.confirm(`Change order ${order.orderNumber} to ${status}?`)) {
      return;
    }

    setSavingId(order._id);

    try {
      const response = await fetch(
        `${API}/landing-pages/orders/${order._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Status update failed");
      }

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId("");
    }
  }


  async function deleteLandingOrder(order) {
    if (order.status === "delivered" || savingId) return;

    const confirmed = window.confirm(
      `Permanently delete landing order ${order.orderNumber}?\n\n` +
      "This action cannot be undone."
    );

    if (!confirmed) return;

    setSavingId(order._id);
    setError("");

    try {
      const response = await fetch(
        `${API}/landing-pages/orders/${encodeURIComponent(order._id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token()}`
          }
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Delete failed");
      }

      setOrders(current =>
        current.filter(item => item._id !== order._id)
      );
    } catch (err) {
      setError(err.message || "Unable to delete order");
    } finally {
      setSavingId("");
    }
  }

  const nextStatuses = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f7f9fc",
      padding: "30px 16px",
      color: "#17202f",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: 1120, margin: "auto" }}>
        <nav style={{ marginBottom: 25 }}>
          <a href="/admin/dashboard">← Admin Dashboard</a>
          {" · "}
          <a href="/admin/landing-pages">Landing Pages</a>
        </nav>

        <h1>Landing Page Orders</h1>
        <p>Cash on Delivery orders submitted from published landing pages.</p>

        <button type="button" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh Orders"}
        </button>

        {error && (
          <p role="alert" style={{ color: "#b42318" }}>{error}</p>
        )}

        {!loading && orders.length === 0 && (
          <p>No landing page orders found.</p>
        )}

        <div style={{ display: "grid", gap: 16, marginTop: 25 }}>
          {orders.map(order => (
            <article key={order._id} style={{
              background: "white",
              padding: 22,
              border: "1px solid #e1e6ee",
              borderRadius: 15,
              overflowWrap: "anywhere"
            }}>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12
              }}>
                <div>
                  <strong>{order.orderNumber}</strong>
                  <p>{order.productTitle} × {order.quantity}</p>
                </div>
                <div>
                  <strong>{money(order.total)}</strong>
                  <p>{order.status}</p>
                </div>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #eee" }}/>

              <p><strong>Customer:</strong> {order.customer?.name}</p>
              <p><strong>Phone:</strong> {order.customer?.phone}</p>
              <p>
                <strong>Address:</strong> {order.customer?.address},
                {" "}{order.customer?.district}
              </p>
              <p>
                <strong>Delivery:</strong> {order.customer?.deliveryArea}
                {" · "}{money(order.deliveryCharge)}
              </p>
              <p><strong>Landing Page:</strong> {order.pageSlug}</p>
              <p>
                <strong>Created:</strong> {
                  new Date(order.createdAt).toLocaleString("en-BD")
                }
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>

                <button
                  type="button"
                  disabled={Boolean(savingId) || order.status === "delivered"}
                  onClick={() => deleteLandingOrder(order)}
                  title={order.status === "delivered"
                    ? "Delivered orders cannot be deleted"
                    : "Permanently delete this landing order"}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid #fecaca",
                    background: "#fff1f2",
                    color: "#be123c",
                    fontWeight: 700,
                    cursor: order.status === "delivered"
                      ? "not-allowed" : "pointer",
                    opacity: order.status === "delivered" ? 0.5 : 1
                  }}
                >
                  {savingId === order._id ? "Processing..." : "Delete Order"}
                </button>
                {(nextStatuses[order.status] || []).map(status => (
                  <button
                    key={status}
                    type="button"
                    disabled={savingId === order._id}
                    onClick={() => updateStatus(order, status)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "1px solid #ccd5df",
                      cursor: "pointer",
                      background: status === "cancelled" ? "#fff1f1" : "#eaf8f0"
                    }}
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
