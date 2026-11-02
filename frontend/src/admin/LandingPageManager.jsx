import { useCallback, useEffect, useState } from "react";
import {
  Plus, Save, UploadCloud, ExternalLink,
  Copy, RefreshCw, ArrowLeft, Trash2
} from "lucide-react";
import "./landingPageManager.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/$/, "");

const emptyForm = {
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  features: "",
  images: [],
  videoUrl: "",
  regularPrice: "",
  salePrice: "",
  freeDelivery: false,
  insideDhaka: "70",
  outsideDhaka: "130",
  cashOnDelivery: true,
  metaTitle: "",
  metaDescription: "",
};

function getToken() {
  return sessionStorage.getItem("MAXPRODUCT-admin-token") ||
    localStorage.getItem("MAXPRODUCT-admin-token") || "";
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function publicUrl(slug) {
  return `${window.location.origin}/lp/${slug}`;
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("Please login to the Admin Dashboard.");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `API error ${response.status}`);
  }

  return result;
}

function toForm(page) {
  return {
    title: page.title || "",
    slug: page.slug || "",
    subtitle: page.subtitle || "",
    description: page.description || "",
    features: (page.features || []).join("\n"),
    images: page.images || [],
    videoUrl: page.video?.url || "",
    regularPrice: String(page.pricing?.regularPrice ?? ""),
    salePrice: String(page.pricing?.salePrice ?? ""),
    freeDelivery: Boolean(page.delivery?.freeDelivery),
    insideDhaka: String(page.delivery?.insideDhaka ?? 70),
    outsideDhaka: String(page.delivery?.outsideDhaka ?? 130),
    cashOnDelivery: page.delivery?.cashOnDelivery !== false,
    metaTitle: page.seo?.metaTitle || "",
    metaDescription: page.seo?.metaDescription || "",
  };
}

function toPayload(form) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    subtitle: form.subtitle.trim(),
    description: form.description.trim(),
    features: form.features.split("\n").map(s => s.trim()).filter(Boolean),
    images: form.images,
    video: { url: form.videoUrl.trim() },
    pricing: {
      regularPrice: Number(form.regularPrice || 0),
      salePrice: Number(form.salePrice || 0),
      currency: "BDT",
    },
    delivery: {
      freeDelivery: form.freeDelivery,
      insideDhaka: Number(form.insideDhaka || 0),
      outsideDhaka: Number(form.outsideDhaka || 0),
      cashOnDelivery: form.cashOnDelivery,
    },
    seo: {
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      ogImage: form.images[0]?.url || "",
    },
  };
}

export default function LandingPageManager() {
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadPages = useCallback(async () => {
    setError("");
    try {
      const result = await apiRequest("/landing-pages");
      setPages(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  function change(key, value) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function startNew() {
    setEditing(null);
    setForm({ ...emptyForm, images: [] });
    setError("");
    setNotice("");
  }

  function editPage(page) {
    setEditing(page);
    setForm(toForm(page));
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraft() {
    setError("");
    setNotice("");

    const payload = toPayload(form);

    if (!payload.title || !payload.slug ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
      setError("Product title এবং সঠিক English URL Slug দিন।");
      return null;
    }

    if (!Number.isFinite(payload.pricing.salePrice) ||
        payload.pricing.salePrice < 0) {
      setError("সঠিক Selling Price দিন।");
      return null;
    }

    setBusy(true);

    try {
      const result = await apiRequest(
        editing ? `/landing-pages/${editing._id}` : "/landing-pages",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setEditing(result.data);
      setForm(toForm(result.data));
      setNotice("Landing Page saved successfully.");
      await loadPages();
      return result.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(page, status) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/landing-pages/${page._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await loadPages();

      if (editing?._id === page._id) {
        setEditing(previous => ({ ...previous, status }));
      }

      setNotice(
        status === "published"
          ? "Landing Page published successfully."
          : "Landing Page status updated."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    const saved = await saveDraft();
    if (saved) await changeStatus(saved, "published");
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024) {
      setError("JPG, PNG অথবা WebP ছবি দিন। সাইজ সর্বোচ্চ 5MB।");
      return;
    }

    if (form.images.length >= 20) {
      setError("একটি Landing Page-এ সর্বোচ্চ 20টি ছবি রাখা যাবে।");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("image", file);

      const result = await apiRequest("/upload/product-image", {
        method: "POST",
        body: data,
      });

      if (!result.data?.url || !result.data?.fileId) {
        throw new Error("ImageKit did not return an image URL.");
      }

      setForm(current => ({
        ...current,
        images: [...current.images, {
          url: result.data.url,
          fileId: result.data.fileId,
          alt: current.title || "Product image",
          position: current.images.length,
        }],
      }));

      setNotice("Image uploaded to ImageKit. Save the page to keep it.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index) {
    setForm(current => ({
      ...current,
      images: current.images
        .filter((_, i) => i !== index)
        .map((image, i) => ({ ...image, position: i })),
    }));
  }


  async function deletePage(page) {
    if (busy || uploading) return;

    const confirmed = window.confirm(
      `Permanently delete "${page.title}"?\n\n` +
      "Its published URL will stop working. This cannot be undone."
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/landing-pages/${page._id}`, {
        method: "DELETE",
      });

      if (editing?._id === page._id) {
        setEditing(null);
        setForm({ ...emptyForm, images: [] });
      }

      await loadPages();
      setNotice("Landing Page deleted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl(slug) {
    try {
      await navigator.clipboard.writeText(publicUrl(slug));
      setNotice("URL copied to clipboard.");
    } catch {
      setNotice(`Page URL: ${publicUrl(slug)}`);
    }
  }

  return (
    <div className="lp-admin-page">
      <header className="lp-admin-top">
        <div>
          <a href="/admin/dashboard"><ArrowLeft size={16}/> Back to Dashboard</a>
          <span className="lp-eyebrow">MAXPRODUCT ADMIN</span>
          <h1>Landing Page Builder</h1>
          <p>Create product campaigns and publish unique URLs.</p>
        </div>
        <button className="lp-btn lp-btn-light" onClick={startNew}>
          <Plus size={18}/> New Landing Page
        </button>
      </header>

      <div className="lp-admin-wrap">
        {error && <div className="lp-alert lp-error" role="alert">{error}</div>}
        {notice && <div className="lp-alert lp-success" role="status">{notice}</div>}

        <section className="lp-panel">
          <div className="lp-section-head">
            <h2>{editing ? "Edit Landing Page" : "Create Landing Page"}</h2>
            <span>{editing?.status || "New Draft"}</span>
          </div>

          <div className="lp-grid-two">
            <label className="lp-field">
              Product Name *
              <input value={form.title} maxLength={180}
                onChange={e => {
                  const title = e.target.value;
                  setForm(current => ({
                    ...current,
                    title,
                    slug: !editing && (!current.slug || current.slug === slugify(current.title))
                      ? slugify(title) : current.slug,
                  }));
                }}
                placeholder="Smart Dictionary Locker"/>
            </label>

            <label className="lp-field">
              URL Slug (English) *
              <input value={form.slug} maxLength={100}
                onChange={e => change("slug", slugify(e.target.value))}
                placeholder="smart-dictionary-locker"/>
            </label>
          </div>

          {form.slug && (
            <p className="lp-url-preview">{publicUrl(form.slug)}</p>
          )}

          <label className="lp-field">
            Product Subtitle
            <input value={form.subtitle} onChange={e => change("subtitle", e.target.value)}
              placeholder="A smart way to keep valuables organized"/>
          </label>

          <label className="lp-field">
            Full Product Description
            <textarea rows={5} value={form.description}
              onChange={e => change("description", e.target.value)}
              placeholder="Explain product benefits and specifications..."/>
          </label>

          <label className="lp-field">
            Product Features (one per line)
            <textarea rows={4} value={form.features}
              onChange={e => change("features", e.target.value)}
              placeholder={"Premium quality\nEasy to use\nCompact design"}/>
          </label>

          <div className="lp-divider"/>
          <h3>Images & Video</h3>
          <p className="lp-hint">
            Images are uploaded to ImageKit. The first image is the main image.
          </p>

          <div className="lp-images">
            {form.images.map((image, index) => (
              <div className="lp-image-tile" key={`${image.url}-${index}`}>
                <img src={image.url} alt={image.alt || "Product"} />
                <button type="button" onClick={() => removeImage(index)}
                  aria-label="Remove image from page">
                  <Trash2 size={16}/>
                </button>
                {index === 0 && <small>Main image</small>}
              </div>
            ))}

            <label className="lp-upload-tile">
              <UploadCloud size={26}/>
              {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/jpeg,image/png,image/webp"
                disabled={uploading || busy}
                onChange={uploadImage}/>
            </label>
          </div>

          <label className="lp-field">
            Product Video HTTPS URL
            <input value={form.videoUrl}
              onChange={e => change("videoUrl", e.target.value)}
              placeholder="https://.../product-video.mp4"/>
          </label>

          <div className="lp-divider"/>
          <h3>Pricing</h3>

          <div className="lp-grid-two">
            <label className="lp-field">
              Regular Price (৳)
              <input type="number" min="0" step="1" value={form.regularPrice}
                onChange={e => change("regularPrice", e.target.value)}/>
            </label>
            <label className="lp-field">
              Selling Price (৳) *
              <input type="number" min="0" step="1" value={form.salePrice}
                onChange={e => change("salePrice", e.target.value)}/>
            </label>
          </div>

          <div className="lp-divider"/>
          <h3>Delivery & Payment</h3>

          <label className="lp-check">
            <input type="checkbox" checked={form.cashOnDelivery}
              onChange={e => change("cashOnDelivery", e.target.checked)}/>
            Cash on Delivery Enabled
          </label>

          <label className="lp-check">
            <input type="checkbox" checked={form.freeDelivery}
              onChange={e => change("freeDelivery", e.target.checked)}/>
            Free Delivery
          </label>

          {!form.freeDelivery && (
            <div className="lp-grid-two">
              <label className="lp-field">
                Inside Dhaka (৳)
                <input type="number" min="0" value={form.insideDhaka}
                  onChange={e => change("insideDhaka", e.target.value)}/>
              </label>
              <label className="lp-field">
                Outside Dhaka (৳)
                <input type="number" min="0" value={form.outsideDhaka}
                  onChange={e => change("outsideDhaka", e.target.value)}/>
              </label>
            </div>
          )}

          <div className="lp-divider"/>
          <h3>SEO Settings</h3>

          <label className="lp-field">
            SEO Title
            <input value={form.metaTitle} maxLength={70}
              onChange={e => change("metaTitle", e.target.value)}/>
          </label>

          <label className="lp-field">
            SEO Description
            <textarea rows={2} maxLength={180}
              value={form.metaDescription}
              onChange={e => change("metaDescription", e.target.value)}/>
          </label>

          <div className="lp-actions">
            <button className="lp-btn lp-btn-light" disabled={busy || uploading}
              onClick={saveDraft}>
              <Save size={17}/> {busy ? "Saving..." : "Save Changes"}
            </button>

            <button className="lp-btn lp-btn-primary"
              disabled={busy || uploading || !form.cashOnDelivery}
              onClick={publish}>
              <ExternalLink size={17}/> Publish Landing Page
            </button>

            {editing?.status === "published" && (
              <button className="lp-btn lp-btn-light"
                onClick={() => changeStatus(editing, "unpublished")}
                disabled={busy}>
                Unpublish
              </button>
            )}
          </div>
        </section>

        <section className="lp-panel">
          <div className="lp-section-head">
            <h2>All Landing Pages</h2>
            <button className="lp-icon-button" onClick={loadPages}
              aria-label="Refresh pages"><RefreshCw size={18}/></button>
          </div>

          {loading ? <p>Loading...</p> : pages.length === 0
            ? <p>No Landing Pages created yet.</p>
            : <div className="lp-page-list">
                {pages.map(page => (
                  <article className="lp-page-item" key={page._id}>
                    {page.images?.[0]?.url
                      ? <img src={page.images[0].url} alt="" />
                      : <div className="lp-empty-image">No Image</div>}

                    <div className="lp-page-info">
                      <strong>{page.title}</strong>
                      <span>{page.slug}</span>
                      <small className={`lp-status lp-status-${page.status}`}>
                        {page.status}
                      </small>
                    </div>

                    <div className="lp-item-actions">
                      <button onClick={() => editPage(page)}>Edit</button>

                      <button
                        type="button"
                        className="lp-delete-button"
                        disabled={busy || uploading}
                        onClick={() => deletePage(page)}
                      >
                        <Trash2 size={15}/> Delete
                      </button>

                      {page.status === "published" && (
                        <>
                          <button onClick={() => copyUrl(page.slug)}>
                            <Copy size={15}/> Copy URL
                          </button>
                          <a href={publicUrl(page.slug)} target="_blank"
                            rel="noreferrer">Open</a>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>}
        </section>
      </div>
    </div>
  );
}
