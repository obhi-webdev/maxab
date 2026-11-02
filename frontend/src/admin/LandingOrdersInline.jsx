import { useCallback, useEffect, useState } from "react";

const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

const money = value =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const transitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

export default function LandingOrdersInline({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState("");
  const [expanded, setExpanded] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/landing-pages/orders/admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || `Orders API error ${response.status}`
        );
      }

      setOrders(result.data || []);
    } catch (err) {
      setError(err.message || "Unable to load landing orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order, status) {
    if (!transitions[order.status]?.includes(status)) return;

    if (!window.confirm(
      `Change ${order.orderNumber} to ${status}?`
    )) return;

    setSaving(order._id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/landing-pages/orders/${order._id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update status"
        );
      }

      setNotice(
        `${order.orderNumber} updated to ${status}.`
      );

      await load();
    } catch (err) {
      setError(err.message || "Status update failed");
    } finally {
      setSaving("");
    }
  }


  async function deleteLandingOrder(order) {
    if (saving || order.status === "delivered") return;

    const confirmed = window.confirm(
      `Permanently delete landing order ${order.orderNumber}?\n\n` +
      "This action cannot be undone."
    );

    if (!confirmed) return;

    setSaving(order._id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/landing-pages/orders/${encodeURIComponent(order._id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
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

      setExpanded(current =>
        current === order._id ? "" : current
      );

      setNotice(`${order.orderNumber} deleted successfully.`);
    } catch (err) {
      setError(err.message || "Unable to delete landing order");
    } finally {
      setSaving("");
    }
  }

  const filtered = orders.filter(order => {
    const text = [
      order.orderNumber,
      order.customer?.name,
      order.customer?.phone,
      order.customer?.district,
      order.productTitle,
      order.pageSlug
    ].join(" ").toLowerCase();

    return text.includes(search.trim().toLowerCase());
  });

  return (
    <section
      aria-label="Landing Page Orders"
      style={{
        marginTop: 32,
        borderRadius: 16,
        border: "1px solid #dde5ef",
        background: "#ffffff",
        padding: 20,
        overflow: "hidden"
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20
      }}>
        <div>
          <span style={{
            display: "block",
            color: "#b45309",
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 6
          }}>
            LANDING PAGE ORDERS
          </span>

          <h2 style={{ margin: "0 0 7px", fontSize: 23 }}>
            Landing Page COD Orders ({orders.length})
          </h2>

          <p style={{ margin: 0, color: "#64748b" }}>
            Orders from dynamic landing pages
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={load}
          style={{
            padding: "11px 16px",
            border: "1px solid #cbd5e1",
            borderRadius: 9,
            background: "#f8fafc",
            cursor: "pointer"
          }}
        >
          {loading ? "Loading..." : "Refresh Landing Orders"}
        </button>
      </div>

      {error && (
        <p role="alert" style={{
          background: "#fff1f2",
          color: "#b42318",
          padding: 13,
          borderRadius: 8
        }}>
          {error}
        </p>
      )}

      {notice && (
        <p role="status" style={{
          background: "#ecfdf3",
          color: "#087443",
          padding: 13,
          borderRadius: 8
        }}>
          {notice}
        </p>
      )}

      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search landing order, phone, product..."
        aria-label="Search landing page orders"
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 9,
          border: "1px solid #cbd5e1",
          marginBottom: 18,
          boxSizing: "border-box"
        }}
      />

      <div style={{ overflowX: "auto" }}>
        <table className="orders-table" style={{
          minWidth: 850,
          width: "100%"
        }}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Product / Source</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(order => (
              <tr key={order._id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                  <small>
                    {new Date(order.createdAt).toLocaleString("en-BD")}
                  </small>
                </td>

                <td>
                  <strong>{order.customer?.name}</strong>
                  <a href={`tel:${order.customer?.phone || ""}`}>
                    {order.customer?.phone}
                  </a>
                  <small>{order.customer?.district}</small>
                </td>

                <td>
                  <strong>{order.productTitle}</strong>
                  <small>Quantity: {order.quantity}</small>
                  <small>Landing Page: {order.pageSlug}</small>
                </td>

                <td>
                  <strong>{money(order.total)}</strong>
                  <small>
                    Delivery: {money(order.deliveryCharge)}
                  </small>
                  <small>Cash on Delivery</small>
                </td>

                <td>
                  <strong>{order.status}</strong>

                  {(transitions[order.status] || []).length > 0 && (
                    <select
                      value=""
                      disabled={saving === order._id}
                      onChange={e =>
                        changeStatus(order, e.target.value)
                      }
                      aria-label={`Update ${order.orderNumber} status`}
                      style={{
                        display: "block",
                        marginTop: 9,
                        padding: 8,
                        maxWidth: 160
                      }}
                    >
                      <option value="" disabled>Change Status</option>
                      {transitions[order.status].map(status => (
                        <option value={status} key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                <td>

                  <button
                    type="button"
                    disabled={Boolean(saving) || order.status === "delivered"}
                    onClick={() => deleteLandingOrder(order)}
                    title={order.status === "delivered"
                      ? "Delivered orders cannot be deleted"
                      : "Permanently delete this landing order"}
                    style={{
                      display: "block",
                      marginTop: 8,
                      padding: "8px 11px",
                      background: "#fff1f2",
                      color: "#be123c",
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      fontWeight: 700,
                      cursor: order.status === "delivered"
                        ? "not-allowed" : "pointer",
                      opacity: order.status === "delivered" ? 0.5 : 1
                    }}
                  >
                    {saving === order._id ? "Processing..." : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(current =>
                      current === order._id ? "" : order._id
                    )}
                    style={{
                      padding: "8px 11px",
                      background: "#f1f5f9",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      cursor: "pointer"
                    }}
                  >
                    {expanded === order._id
                      ? "Hide Details"
                      : "View Details"}
                  </button>

                  {expanded === order._id && (
                    <div style={{
                      marginTop: 12,
                      padding: 12,
                      background: "#f8fafc",
                      borderRadius: 9,
                      minWidth: 200,
                      whiteSpace: "normal",
                      overflowWrap: "anywhere"
                    }}>
                      <strong>Delivery Address</strong>
                      <p>{order.customer?.address}</p>
                      <p>District: {order.customer?.district}</p>
                      <p>
                        Area: {order.customer?.deliveryArea}
                      </p>
                      <p>Unit Price: {money(order.unitPrice)}</p>
                      <p>Subtotal: {money(order.subtotal)}</p>
                      <p>Delivery: {money(order.deliveryCharge)}</p>
                      <p>Total: {money(order.total)}</p>
                      <p>Payment: COD</p>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p>Loading landing page orders...</p>}

      {!loading && filtered.length === 0 && !error && (
        <p style={{
          padding: 24,
          textAlign: "center",
          color: "#64748b"
        }}>
          No landing page orders found.
        </p>
      )}
    </section>
  );
}
