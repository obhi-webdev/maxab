import { useEffect, useState } from "react";
import { ArrowLeft, Upload, Plus, Pencil, Trash2, Save } from "lucide-react";
import "./admin.css";
import "./bannerAdmin.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

const blank = {
  title: "",
  subtitle: "",
  image: "",
  buttonText: "Shop Now",
  buttonLink: "/#shop",
  sortOrder: 0,
  isActive: true
};

export default function BannerManager() {
  const token = sessionStorage.getItem("maxab-admin-token");
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function call(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }

  async function load() {
    try {
      const result = await call("/banners/admin/all");
      setBanners(result.data || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

  function change(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function reset() {
    setEditing(null);
    setForm(blank);
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Choose a JPG, PNG or WebP image under 5 MB.");
      event.target.value = "";
      return;
    }

    setBusy(true);
    setError("");
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
        throw new Error(result.message || "Image upload failed");
      }

      change("image", result.data.url);
      setNotice("Image uploaded. Save the banner to publish.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await call(editing ? `/banners/${editing}` : "/banners", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder)
        })
      });

      reset();
      setNotice("Banner saved successfully.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function editBanner(banner) {
    setEditing(banner._id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(banner) {
    if (!window.confirm(`Delete "${banner.title}"?`)) return;
    setBusy(true);
    setError("");

    try {
      await call(`/banners/${banner._id}`, { method: "DELETE" });
      setNotice("Banner deleted.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="banner-admin-page">
        <h2>Admin Login Required</h2>
        <a href="/admin/login">Sign In</a>
      </div>
    );
  }

  return (
    <div className="banner-admin-page">
      <div className="banner-admin-container">
        <a href="/admin/dashboard" className="banner-admin-back">
          <ArrowLeft size={17}/> Back to Dashboard
        </a>

        <div className="banner-admin-heading">
          <div>
            <span>MAXAB STORE MANAGEMENT</span>
            <h1>Homepage Banners</h1>
            <p>Upload and manage promotional banners.</p>
          </div>
          <button className="admin-primary" onClick={reset}>
            <Plus size={17}/> New Banner
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}
        {notice && <div className="admin-notice">{notice}</div>}

        <div className="banner-admin-grid">
          <form className="banner-admin-editor" onSubmit={save}>
            <h2>{editing ? "Edit Banner" : "Add Banner"}</h2>

            <label>Banner Title (Optional)</label>
            <input
              maxLength={120}
              value={form.title}
              onChange={e => change("title", e.target.value)}
              placeholder="Discover Better Everyday Essentials"
            />

            <label>Subtitle</label>
            <textarea
              rows={3}
              maxLength={250}
              value={form.subtitle}
              onChange={e => change("subtitle", e.target.value)}
            />

            <label>Banner Image *</label>
            <label className="banner-upload-label">
              <Upload size={18}/>
              {busy ? "Processing..." : "Upload Banner Image"}
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={uploadImage}
              />
            </label>

            {form.image && (
              <img
                className="banner-image-preview"
                src={form.image}
                alt="Banner preview"
              />
            )}

            <label>Button Text</label>
            <input
              value={form.buttonText}
              maxLength={40}
              onChange={e => change("buttonText", e.target.value)}
            />

            <label>Button Link</label>
            <input
              value={form.buttonLink}
              onChange={e => change("buttonLink", e.target.value)}
              placeholder="/#shop"
            />

            <label>Display Order</label>
            <input
              type="number"
              min="0"
              max="10000"
              step="1"
              value={form.sortOrder}
              onChange={e => change("sortOrder", e.target.value)}
            />

            <label className="banner-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => change("isActive", e.target.checked)}
              />
              Active Banner
            </label>

            <button className="admin-primary banner-save" disabled={busy || !form.image}>
              <Save size={17}/> Save Banner
            </button>
          </form>

          <section className="banner-admin-list">
            <h2>All Banners ({banners.length})</h2>
            {!banners.length && <p>No banners yet.</p>}

            {banners.map(banner => (
              <article className="banner-admin-item" key={banner._id}>
                <img src={banner.image} alt={banner.title}/>
                <div className="banner-admin-item-info">
                  <h3>{banner.title}</h3>
                  <p>{banner.subtitle}</p>
                  <small>
                    Order {banner.sortOrder} ·
                    {banner.isActive ? " Active" : " Inactive"}
                  </small>
                  <div className="banner-admin-actions">
                    <button onClick={() => editBanner(banner)}>
                      <Pencil size={15}/> Edit
                    </button>
                    <button onClick={() => remove(banner)} disabled={busy}>
                      <Trash2 size={15}/> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
