import OrderDetailsModal from "./components/OrderDetailsModal";
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, Plus, Pencil,
  Trash2, LogOut, Save, X, RefreshCw,
  ArrowLeft, ShieldCheck
} from "lucide-react";
import "./admin.css";

const API = "http://localhost:5001/api";

const emptyProduct = {
  name: "",
  slug: "",
  category: "Smart Gadgets",
  description: "",
  price: "",
  oldPrice: "",
  stock: "",
  featured: false,
  isActive: true
};

async function request(path, options = {}, token = "") {
  let response;

  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error("Backend connection failed. Check port 5001.");
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      onLogin(result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <a className="admin-brand" href="/">MAXAB<span>.</span></a>

        <div className="admin-login-icon">
          <ShieldCheck size={29}/>
        </div>

        <h1>Admin Login</h1>
        <p>Sign in to manage your MAXAB store.</p>

        {error && <div className="admin-error">{error}</div>}

        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your admin email"
          autoComplete="username"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
          autoComplete="current-password"
          required
        />

        <button className="admin-primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <a className="admin-return" href="/">
          <ArrowLeft size={16}/> Back to Store
        </a>
      </form>
    </div>
  );
}

function ProductForm({ product, onSave, onCancel, saving, token }) {
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/api/categories")
      .then(response => {
        if (!response.ok) throw new Error("Categories unavailable");
        return response.json();
      })
      .then(result => setAvailableCategories(result.data || []))
      .catch(() => setAvailableCategories([]));
  }, []);

  const [form, setForm] = useState({
    ...emptyProduct,
    ...product,
    price: product?.price ?? "",
    oldPrice: product?.oldPrice ?? "",
    stock: product?.stock ?? ""
  });

  const [images, setImages] = useState(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function uploadImage(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 12) {
      setUploadError("Maximum 12 images per product.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setUploadError("");

    const uploaded = [];

    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be 5 MB or smaller.");
        }

        const data = new FormData();
        data.append("image", file);

        const response = await fetch(
          "http://localhost:5001/api/upload/product-image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: data
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Upload failed");
        }

        uploaded.push(result.data.url);
        setImages(current => [...current, result.data.url]);
      }
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(url) {
    setImages(current => current.filter(item => item !== url));
  }

  function update(key, value) {
    setForm(current => ({
      ...current,
      [key]: value
    }));
  }

  function changeName(value) {
    setForm(current => ({
      ...current,
      name: value,
      slug: product?.id || product?._id
        ? current.slug
        : value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
    }));
  }

  function submit(e) {
    e.preventDefault();

    onSave({
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      category: form.category,
      description: form.description,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice || 0),
      stock: Number(form.stock || 0),
      images: images,
      featured: form.featured,
      isActive: form.isActive
    });
  }

  return (
    <form className="admin-product-form" onSubmit={submit}>
      <div className="admin-form-title">
        <h2>{product ? "Edit Product" : "Add New Product"}</h2>
        <button type="button" onClick={onCancel} aria-label="Close">
          <X size={21}/>
        </button>
      </div>

      <div className="admin-form-grid">
        <div className="admin-field admin-wide">
          <label>Product Name *</label>
          <input
            value={form.name}
            onChange={e => changeName(e.target.value)}
            placeholder="Smart Dictionary Locker"
            required
            maxLength={180}
          />
        </div>

        <div className="admin-field">
          <label>URL Slug *</label>
          <input
            value={form.slug}
            onChange={e => update("slug", e.target.value)}
            placeholder="smart-dictionary-locker"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </div>

        <div className="admin-field">
          <label>Category *</label>
          <select
            value={form.category}
            onChange={e => update("category", e.target.value)}
          >
            <option value="" disabled>Select Category</option>
            {availableCategories.map(category => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
            {form.category &&
              !availableCategories.some(c => c.name === form.category) && (
                <option value={form.category}>{form.category}</option>
              )}
          </select>
        </div>

        <div className="admin-field">
          <label>Selling Price (৳) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={e => update("price", e.target.value)}
            required
          />
        </div>

        <div className="admin-field">
          <label>Regular Price (৳)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.oldPrice}
            onChange={e => update("oldPrice", e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label>Available Stock</label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={e => update("stock", e.target.value)}
          />
        </div>

        <div className="admin-field admin-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={e => update("featured", e.target.checked)}
            />
            Featured Product
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => update("isActive", e.target.checked)}
            />
            Active Product
          </label>
        </div>

        <div className="admin-field admin-wide">
          <label>Product Description</label>
          <textarea
            rows="5"
            value={form.description}
            onChange={e => update("description", e.target.value)}
            placeholder="Write your product description..."
          />
        </div>
      </div>

      <div className="admin-image-upload">
        <h3>Product Images</h3>
        <p>Upload JPG, PNG or WebP images. Maximum 5 MB each.</p>

        <label className="admin-upload-button">
          {uploading ? "Uploading..." : "+ Upload Product Images"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={uploadImage}
            hidden
          />
        </label>

        {uploadError && (
          <div className="admin-error">{uploadError}</div>
        )}

        <div className="admin-image-gallery">
          {images.map((url, index) => (
            <div className="admin-image-preview" key={url}>
              <img src={url} alt={`Product image ${index + 1}`} />
              {index === 0 && <span>Main Image</span>}
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button
          className="admin-primary"
          type="submit"
          disabled={saving || uploading}
        >
          <Save size={17}/>
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

function Dashboard({ token, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const result = await request(
        "/products/admin/all", {}, token
      );
      setProducts(result.data || []);
    } catch (err) {
      setError(err.message);
      if (/session|authentication|token/i.test(err.message)) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function saveProduct(data) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const isEdit = Boolean(editing?._id);

      await request(
        isEdit
          ? `/products/${editing._id}`
          : "/products",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify(data)
        },
        token
      );

      setEditing(undefined);
      setNotice(
        isEdit ? "Product updated successfully." : "Product created successfully."
      );
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}" permanently?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await request(
        `/products/${product._id}`,
        { method: "DELETE" },
        token
      );

      setNotice("Product deleted.");
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  const active = products.filter(p => p.isActive).length;
  const lowStock = products.filter(p => p.stock <= 5).length;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/admin/dashboard" className="admin-sidebar-logo">
          MAXAB<span>.</span>
          <small>ADMIN PANEL</small>
        </a>

        <div className="admin-sidebar-links">
          <div className="admin-sidebar-link selected">
            <LayoutDashboard size={19}/> Overview
          </div>
          <a className="admin-sidebar-link" href="#admin-products">
            <Package size={19}/> Products
          </a>
          <a className="admin-sidebar-link" href="#admin-orders">
            Orders
          </a>
        </div>

        <a href="/admin/logo-settings" className="admin-sidebar-link">
          Website Logo
        </a>
        <a href="/admin/meta-tracking" className="admin-sidebar-link">
          Meta Pixel & CAPI
        </a>
        <a href="/admin/product-images" className="admin-sidebar-link">
          Product Images
        </a>
        <a href="/admin/banners" className="admin-sidebar-link">
          Homepage Banners
        </a>
        <a href="/admin/categories" className="admin-sidebar-link">
          Categories
        </a>
        <a href="/admin/delivery-settings" className="admin-sidebar-link">
          Delivery Settings
        </a>

        <a href="/" className="admin-sidebar-link">
          <ArrowLeft size={18}/> View Store
        </a>

        <button className="admin-sidebar-link" onClick={onLogout}>
          <LogOut size={18}/> Log Out
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <span>STORE MANAGEMENT</span>
            <h1>Admin Dashboard</h1>
            <p>Manage your MAXAB product catalog.</p>
          </div>
          <button
            className="admin-primary"
            onClick={() => setEditing(null)}
          >
            <Plus size={18}/> Add Product
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}
        {notice && <div className="admin-notice">{notice}</div>}

        <div className="admin-stat-grid">
          <div className="admin-stat">
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Active Products</span>
            <strong>{active}</strong>
          </div>
          <div className="admin-stat">
            <span>Low Stock (≤5)</span>
            <strong>{lowStock}</strong>
          </div>
        </div>

        {editing !== undefined ? (
          <ProductForm
            key={editing?._id || "new"}
            product={editing}
            onSave={saveProduct}
            onCancel={() => setEditing(undefined)}
            saving={saving}
            token={token}
          />
        ) : (
          <section id="admin-products" className="admin-table-section">
            <div className="admin-table-header">
              <h2>All Products</h2>
              <button onClick={loadProducts} aria-label="Refresh products">
                <RefreshCw size={18}/>
              </button>
            </div>

            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td>
                        <strong>{product.name}</strong>
                        <small>{product.slug}</small>
                      </td>
                      <td>{product.category}</td>
                      <td>৳{product.price.toLocaleString("en-BD")}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span className={
                          product.isActive ? "admin-active" : "admin-inactive"
                        }>
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-buttons">
                          <button
                            aria-label={`Edit ${product.name}`}
                            onClick={() => setEditing(product)}
                          >
                            <Pencil size={17}/>
                          </button>
                          <button
                            className="admin-delete"
                            aria-label={`Delete ${product.name}`}
                            onClick={() => deleteProduct(product)}
                          >
                            <Trash2 size={17}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && products.length === 0 && (
              <p className="admin-empty">No products yet. Add your first product.</p>
            )}

            {loading && <p className="admin-empty">Loading products...</p>}
          </section>
        )}
        <OrdersPanel token={token}/>
      </main>
    </div>
  );
}


function OrdersPanel({ token }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const result = await request(
        "/orders/admin/all",
        {},
        token
      );

      setOrders(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [token]);

  async function changeStatus(order, status) {
    if (order.status === status) return;

    if (!window.confirm(
      `Change ${order.orderNumber} to ${status}?`
    )) return;

    setUpdating(order._id);
    setError("");
    setNotice("");

    try {
      await request(
        `/orders/${order._id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status })
        },
        token
      );

      setNotice(
        `Order ${order.orderNumber} updated to ${status}.`
      );

      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating("");
    }
  }

  const statuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled"
  ];

  const statusCount = status =>
    orders.filter(o => o.status === status).length;

  const filtered = orders.filter(order => {
    const query = search.trim().toLowerCase();

    const text = [
      order.orderNumber,
      order.customer?.name,
      order.customer?.phone,
      order.customer?.district
    ].join(" ").toLowerCase();

    return (
      (filter === "all" || order.status === filter) &&
      text.includes(query)
    );
  });

  return (
    <section id="admin-orders" className="orders-management">
      <div className="orders-section-heading">
        <div>
          <span className="orders-eyebrow">
            SALES & FULFILLMENT
          </span>
          <h2>Order Management</h2>
          <p>Review and manage customer orders.</p>
        </div>

        <button
          className="orders-refresh"
          onClick={loadOrders}
          disabled={loading}
        >
          Refresh Orders
        </button>
      </div>

      <div className="orders-stats">
        {[
          ["Total Orders", orders.length],
          ["Pending", statusCount("pending")],
          ["Confirmed", statusCount("confirmed")],
          ["Delivered", statusCount("delivered")]
        ].map(([label, value]) => (
          <div className="orders-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {notice && <div className="admin-notice">{notice}</div>}

      <div className="orders-panel">
        <div className="orders-toolbar">
          <input
            type="search"
            value={search}
            placeholder="Search order, customer or phone..."
            onChange={e => setSearch(e.target.value)}
            aria-label="Search orders"
          />

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {statuses.map(status => (
              <option value={status} key={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="orders-table-scroll">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Details</th>
                <th>Customer</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Delivery</th>
                <th>Status</th>
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
                    <button
                      type="button"
                      className="maxab-view-order"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </button>
                  </td>

                  <td>
                    <strong>{order.customer?.name}</strong>
                    <a href={`tel:${order.customer?.phone}`}>
                      {order.customer?.phone}
                    </a>
                    <small>{order.customer?.district}</small>
                  </td>

                  <td>
                    {order.items?.map((item, i) => (
                      <div className="order-product-line" key={i}>
                        {item.name} × {item.quantity}
                      </div>
                    ))}
                  </td>

                  <td>
                    <strong>
                      ৳{Number(order.total).toLocaleString("en-BD")}
                    </strong>
                    <small>COD</small>
                  </td>

                  <td>
                    <div className="order-address">
                      {order.customer?.address}
                    </div>
                    <small>
                      {order.customer?.deliveryArea === "inside"
                        ? "Inside City"
                        : "Outside City"}
                    </small>
                  </td>

                  <td>
                    <select
                      className={`order-status status-${order.status}`}
                      value={order.status}
                      disabled={updating === order._id}
                      onChange={e =>
                        changeStatus(order, e.target.value)
                      }
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="orders-empty">Loading orders...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="orders-empty">
            No matching orders found.
          </div>
        )}

        <div className="orders-table-footer">
          Showing {filtered.length} of {orders.length} recent orders
        </div>
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </section>
  );
}

export default function AdminApp() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("maxab-admin-token") || ""
  );

  function login(value) {
    sessionStorage.setItem("maxab-admin-token", value);
    setToken(value);
    window.history.replaceState({}, "", "/admin/dashboard");
  }

  function logout() {
    sessionStorage.removeItem("maxab-admin-token");
    setToken("");
    window.history.replaceState({}, "", "/admin/login");
  }

  return token
    ? <Dashboard token={token} onLogout={logout}/>
    : <AdminLogin onLogin={login}/>;
}
