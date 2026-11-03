import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, RefreshCw, Copy, Check, Phone, MapPin,
  Package, ChevronDown, ChevronUp, Trash2,
  Truck, ClipboardCopy, ShoppingBag, Filter
} from "lucide-react";
import "./landingOrdersMobile.css";

const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

const STATUSES = [
  "all", "pending", "confirmed", "shipped",
  "delivered", "cancelled"
];

const TRANSITIONS = Object.fromEntries(
  STATUSES
    .filter(status => status !== "all")
    .map(current => [
      current,
      STATUSES.filter(
        next => next !== "all" && next !== current
      )
    ])
);

const money = value =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const titleCase = text =>
  String(text || "").replace(/^./, c => c.toUpperCase());

const clean = value => String(value ?? "").trim();

function fullAddress(customer = {}) {
  return [
    clean(customer.address),
    clean(customer.deliveryArea),
    clean(customer.district)
  ].filter((v, index, arr) =>
    v && arr.indexOf(v) === index
  ).join(", ");
}

function orderText(order, courierOnly = false) {
  const customer = order.customer || {};
  const basic = [
    `Name: ${clean(customer.name)}`,
    `Phone: ${clean(customer.phone)}`,
    `Address: ${fullAddress(customer)}`,
    `COD Amount: ${money(order.total)}`
  ];

  if (courierOnly) return basic.join("\n");

  return [
    `Order: ${clean(order.orderNumber)}`,
    ...basic,
    `Product: ${clean(order.productTitle)}`,
    `Quantity: ${order.quantity ?? 1}`,
    `Unit Price: ${money(order.unitPrice)}`,
    `Delivery Charge: ${money(order.deliveryCharge)}`,
    `Status: ${titleCase(order.status)}`,
    "Payment: Cash on Delivery"
  ].join("\n");
}

async function copyToClipboard(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.focus();
  field.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy not supported");
    }
  } finally {
    field.remove();
  }
}

export default function LandingOrdersInline({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState("");
  const [expanded, setExpanded] = useState("");
  const [copied, setCopied] = useState("");

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
          result.message || `HTTP ${response.status}`
        );
      }

      setOrders(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (err) {
      setError(err.message || "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const output = Object.fromEntries(
      STATUSES.map(status => [status, 0])
    );
    output.all = orders.length;

    for (const order of orders) {
      if (Object.hasOwn(output, order.status)) {
        output[order.status] += 1;
      }
    }
    return output;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders
      .filter(order => {
        if (filter !== "all" && order.status !== filter) {
          return false;
        }

        const customer = order.customer || {};

        const text = [
          order.orderNumber,
          order.productTitle,
          order.pageSlug,
          customer.name,
          customer.phone,
          customer.address,
          customer.district,
          customer.deliveryArea
        ].join(" ").toLowerCase();

        return text.includes(q);
      })
      .sort((a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
  }, [orders, filter, search]);

  async function copyValue(key, value) {
    if (!clean(value)) {
      setError("No information available to copy.");
      return;
    }

    try {
      await copyToClipboard(String(value));
      setCopied(key);
      setError("");
      setNotice("Copied to clipboard.");
    } catch {
      setError(
        "Copy failed. Use HTTPS or localhost and allow clipboard access."
      );
    }
  }

  async function changeStatus(order, nextStatus) {
    if (!(TRANSITIONS[order.status] || []).includes(nextStatus)) {
      return;
    }

    if (!window.confirm(
      `Change ${order.orderNumber} to ${nextStatus}?`
    )) return;

    setSaving(order._id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/landing-pages/orders/${encodeURIComponent(order._id)}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: nextStatus })
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Status update failed");
      }

      setOrders(current => current.map(item =>
        item._id === order._id
          ? { ...item, status: nextStatus }
          : item
      ));

      setNotice(`${order.orderNumber}: ${titleCase(nextStatus)}`);
    } catch (err) {
      setError(err.message || "Status update failed");
    } finally {
      setSaving("");
    }
  }

  async function deleteLandingOrder(order) {
    if (saving || order.status === "delivered") return;

    if (!window.confirm(
      `Permanently delete ${order.orderNumber}?\n\n` +
      "This action cannot be undone."
    )) return;

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
      setNotice(`${order.orderNumber} deleted.`);
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setSaving("");
    }
  }

  function CopyButton({ id, value, label = "Copy" }) {
    return (
      <button
        type="button"
        className="lmo-copy"
        onClick={() => copyValue(id, value)}
        title={`Copy ${label}`}
      >
        {copied === id ? <Check size={15}/> : <Copy size={15}/>}
        {copied === id ? "Copied" : label}
      </button>
    );
  }

  return (
    <section className="lmo" aria-label="Landing Page Orders">
      <div className="lmo-head">
        <div>
          <span className="lmo-eyebrow">MAXPRODUCT ADMIN</span>
          <h2>Landing Page Orders</h2>
          <p>Manage COD orders from all landing pages.</p>
        </div>
        <button
          type="button"
          className="lmo-refresh"
          disabled={loading || Boolean(saving)}
          onClick={load}
        >
          <RefreshCw size={17}/>
          Refresh
        </button>
      </div>

      <div className="lmo-summary">
        <div>
          <ShoppingBag size={19}/>
          <span>Total Orders</span>
          <strong>{counts.all}</strong>
        </div>
        <div>
          <Package size={19}/>
          <span>Pending</span>
          <strong>{counts.pending}</strong>
        </div>
        <div>
          <Truck size={19}/>
          <span>Delivered</span>
          <strong>{counts.delivered}</strong>
        </div>
      </div>

      <div className="lmo-filter-heading">
        <Filter size={17}/>
        <strong>Filter by Status</strong>
      </div>

      <div className="lmo-filters" aria-label="Order status filters">
        {STATUSES.map(status => (
          <button
            type="button"
            key={status}
            className={
              "lmo-filter " +
              (filter === status ? "is-active" : "")
            }
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
          >
            {titleCase(status)}
            <span>{counts[status]}</span>
          </button>
        ))}
      </div>

      <label className="lmo-search">
        <Search size={19}/>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search order, name, phone, address..."
        />
      </label>

      {error && (
        <div className="lmo-alert lmo-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="lmo-alert lmo-notice" role="status">
          {notice}
        </div>
      )}

      <div className="lmo-list-heading">
        <strong>{titleCase(filter)} Orders</strong>
        <span>{filtered.length} results</span>
      </div>

      {loading && (
        <div className="lmo-empty">Loading orders...</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="lmo-empty">
          No matching landing page orders.
        </div>
      )}

      <div className="lmo-orders">
        {filtered.map(order => {
          const customer = order.customer || {};
          const isOpen = expanded === order._id;
          const busy = Boolean(saving);
          const validPhone = /^[+0-9()\s-]+$/.test(
            clean(customer.phone)
          );

          return (
            <article className="lmo-card" key={order._id}>
              <div className="lmo-card-top">
                <div>
                  <strong className="lmo-order-number">
                    {order.orderNumber}
                  </strong>
                  <small>
                    {order.createdAt
                      ? new Date(order.createdAt)
                          .toLocaleString("en-BD")
                      : ""}
                  </small>
                </div>
                <span className={`lmo-badge lmo-${order.status}`}>
                  {titleCase(order.status)}
                </span>
              </div>

              <div className="lmo-product">
                <strong>{order.productTitle || "Product"}</strong>
                <span>
                  Qty: {order.quantity ?? 1}
                  {" • "}
                  {order.pageSlug || "Landing page"}
                </span>
              </div>

              <div className="lmo-customer">
                <div className="lmo-info">
                  <label>Customer Name</label>
                  <div>
                    <strong>{customer.name || "—"}</strong>
                    <CopyButton
                      id={`${order._id}-name`}
                      value={customer.name}
                    />
                  </div>
                </div>

                <div className="lmo-info">
                  <label>Phone Number</label>
                  <div>
                    <strong>{customer.phone || "—"}</strong>
                    <span className="lmo-inline-actions">
                      {validPhone && (
                        <a
                          className="lmo-call"
                          href={`tel:${clean(customer.phone)}`}
                          aria-label={`Call ${customer.phone}`}
                        >
                          <Phone size={15}/>
                        </a>
                      )}
                      <CopyButton
                        id={`${order._id}-phone`}
                        value={customer.phone}
                      />
                    </span>
                  </div>
                </div>

                <div className="lmo-info">
                  <label>Delivery Address</label>
                  <div>
                    <strong>
                      {fullAddress(customer) || "—"}
                    </strong>
                    <CopyButton
                      id={`${order._id}-address`}
                      value={fullAddress(customer)}
                    />
                  </div>
                </div>
              </div>

              <div className="lmo-amount">
                <div>
                  <span>COD Amount</span>
                  <strong>{money(order.total)}</strong>
                </div>
                <small>
                  Delivery: {money(order.deliveryCharge)}
                </small>
              </div>

              <div className="lmo-copy-actions">
                <button
                  type="button"
                  className="lmo-copy-all"
                  onClick={() => copyValue(
                    `${order._id}-all`,
                    orderText(order)
                  )}
                >
                  <ClipboardCopy size={17}/>
                  {copied === `${order._id}-all`
                    ? "Copied!"
                    : "Copy All Details"}
                </button>

                <button
                  type="button"
                  className="lmo-copy-courier"
                  onClick={() => copyValue(
                    `${order._id}-courier`,
                    orderText(order, true)
                  )}
                >
                  <Truck size={17}/>
                  {copied === `${order._id}-courier`
                    ? "Copied!"
                    : "Copy Courier Info"}
                </button>
              </div>

              <button
                type="button"
                className="lmo-details-toggle"
                aria-expanded={isOpen}
                onClick={() => setExpanded(
                  isOpen ? "" : order._id
                )}
              >
                {isOpen ? "Hide Order Management" : "Manage Order"}
                {isOpen
                  ? <ChevronUp size={18}/>
                  : <ChevronDown size={18}/>}
              </button>

              {isOpen && (
                <div className="lmo-details">
                  <div className="lmo-detail-row">
                    <span>District</span>
                    <strong>{customer.district || "—"}</strong>
                    <CopyButton
                      id={`${order._id}-district`}
                      value={customer.district}
                    />
                  </div>
                  <div className="lmo-detail-row">
                    <span>Delivery Area</span>
                    <strong>{customer.deliveryArea || "—"}</strong>
                  </div>
                  <div className="lmo-detail-row">
                    <span>Unit Price</span>
                    <strong>{money(order.unitPrice)}</strong>
                  </div>
                  <div className="lmo-detail-row">
                    <span>Subtotal</span>
                    <strong>{money(order.subtotal)}</strong>
                  </div>
                  <div className="lmo-detail-row">
                    <span>Payment</span>
                    <strong>Cash on Delivery</strong>
                  </div>

                  <div className="lmo-status-control">
                    <label htmlFor={`status-${order._id}`}>
                      Change Order Status
                    </label>
                    <select
                      id={`status-${order._id}`}
                      value=""
                      disabled={
                        busy ||
                        !(TRANSITIONS[order.status] || []).length
                      }
                      onChange={e => {
                        if (e.target.value) {
                          changeStatus(order, e.target.value);
                        }
                      }}
                    >
                      <option value="">Select Next Status</option>
                      {(TRANSITIONS[order.status] || []).map(status => (
                        <option value={status} key={status}>
                          {titleCase(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {order.status !== "delivered" && (
                    <button
                      type="button"
                      className="lmo-delete"
                      disabled={busy}
                      onClick={() => deleteLandingOrder(order)}
                    >
                      <Trash2 size={16}/>
                      {saving === order._id
                        ? "Processing..."
                        : "Delete Order"}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
