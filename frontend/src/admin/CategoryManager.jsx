import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, Save, Upload } from "lucide-react";
import "./admin.css";

const API = "http://localhost:5001/api";

const empty = {
  name: "",
  slug: "",
  description: "",
  image: "",
  sortOrder: 0,
  isActive: true
};

async function api(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Request failed");
  return body;
}

export default function CategoryManager() {
  const token = sessionStorage.getItem("maxab-admin-token");

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api("/categories/admin/all", token);
      setCategories(result.data || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function change(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function setName(name) {
    setForm(current => ({
      ...current,
      name,
      slug: editingId ? current.slug : name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    }));
  }

  function edit(category) {
    setEditingId(category._id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(empty);
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    if (file.size > 5 * 1024 * 1024 ||
        !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG or WebP image under 5 MB.");
      event.target.value = "";
      return;
    }

    setBusy(true);

    try {
      const data = new FormData();
      data.append("image", file);

      const response = await fetch(`${API}/upload/product-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      change("image", result.data.url);
      setMessage("Image uploaded. Save the category to finish.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder)
      };

      await api(
        editingId ? `/categories/${editingId}` : "/categories",
        token,
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload)
        }
      );

      reset();
      setMessage("Category saved successfully.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(category) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    setBusy(true);
    setError("");

    try {
      await api(`/categories/${category._id}`, token, {
        method: "DELETE"
      });
      setMessage("Category deleted.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="category-admin-page">
        <div className="category-admin-container">
          <h2>Admin Login Required</h2>
          <a href="/admin/login">Go to Admin Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="category-admin-page">
      <div className="category-admin-container">
        <a href="/admin/dashboard" className="category-back">
          <ArrowLeft size={17}/> Back to Dashboard
        </a>

        <div className="category-admin-heading">
          <div>
            <span>MAXAB STORE MANAGEMENT</span>
            <h1>Product Categories</h1>
            <p>Manage categories, homepage banners and display order.</p>
          </div>
          <button onClick={reset} className="admin-primary">
            <Plus size={17}/> New Category
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-notice">{message}</div>}

        <div className="category-admin-layout">
          <form className="category-editor" onSubmit={save}>
            <h2>{editingId ? "Edit Category" : "Add Category"}</h2>

            <label>Category Name *</label>
            <input
              required
              value={form.name}
              onChange={e => setName(e.target.value)}
              placeholder="Smart Gadgets"
            />

            <label>Slug *</label>
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={form.slug}
              onChange={e => change("slug", e.target.value)}
              placeholder="smart-gadgets"
            />

            <label>Description</label>
            <textarea
              rows="3"
              maxLength={500}
              value={form.description}
              onChange={e => change("description", e.target.value)}
            />

            <label>Category Banner</label>
            <label className="category-upload">
              <Upload size={17}/>
              {busy ? "Processing..." : "Upload Image"}
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={uploadImage}
              />
            </label>

            {form.image && (
              <div className="category-preview">
                <img src={form.image} alt="Category banner preview"/>
                <button type="button" onClick={() => change("image", "")}>
                  Remove Image
                </button>
              </div>
            )}

            <label>Display Order</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.sortOrder}
              onChange={e => change("sortOrder", e.target.value)}
            />

            <label className="category-active-label">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => change("isActive", e.target.checked)}
              />
              Active Category
            </label>

            <button className="admin-primary category-save" disabled={busy}>
              <Save size={17}/>
              {busy ? "Processing..." : "Save Category"}
            </button>
          </form>

          <section className="category-list">
            <h2>All Categories ({categories.length})</h2>

            {categories.length === 0 && (
              <p>No categories yet. Add your first category.</p>
            )}

            {categories.map(category => (
              <div className="category-list-item" key={category._id}>
                <div className="category-list-image">
                  {category.image
                    ? <img src={category.image} alt={category.name}/>
                    : <span>No Image</span>
                  }
                </div>

                <div className="category-list-info">
                  <strong>{category.name}</strong>
                  <small>{category.slug}</small>
                  <small>
                    Order: {category.sortOrder} ·
                    {category.isActive ? " Active" : " Inactive"}
                  </small>
                </div>

                <div className="category-list-actions">
                  <button
                    aria-label={`Edit ${category.name}`}
                    onClick={() => edit(category)}
                  ><Pencil size={17}/></button>

                  <button
                    aria-label={`Delete ${category.name}`}
                    disabled={busy}
                    onClick={() => remove(category)}
                  ><Trash2 size={17}/></button>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
