import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Upload,
  Save,
  Image,
  Trash2,
  Globe
} from "lucide-react";
import { applySiteFavicon } from "../utils/siteFavicon";
import "./logoSettings.css";

const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function LogoSettings() {
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Keep original authentication key.
  const token = sessionStorage.getItem("MAXPRODUCT-admin-token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(`${API}/site-branding`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: controller.signal
    })
      .then(async response => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Cannot load brand settings"
          );
        }

        setLogoUrl(result.data?.logoUrl || "");
        setFaviconUrl(result.data?.faviconUrl || "");
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview("");
      return;
    }

    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!faviconFile) {
      setFaviconPreview("");
      return;
    }

    const url = URL.createObjectURL(faviconFile);
    setFaviconPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [faviconFile]);

  function chooseImage(event, target) {
    const selected = event.target.files?.[0];

    if (!selected) return;

    if (!ALLOWED.includes(selected.type)) {
      setError("Select a PNG, JPG or WebP image.");
      event.target.value = "";
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError("Maximum file size is 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setMessage("");

    if (target === "favicon") {
      setFaviconFile(selected);
    } else {
      setLogoFile(selected);
    }

    event.target.value = "";
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API}/upload/product-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.data?.url) {
      throw new Error(result.message || "Image upload failed");
    }

    return result.data.url;
  }

  async function saveBranding(url, isFavicon) {
    const endpoint = isFavicon
      ? `${API}/site-branding/favicon`
      : `${API}/site-branding`;

    const payload = isFavicon
      ? { faviconUrl: url }
      : { logoUrl: url };

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Could not save settings");
    }

    return result.data;
  }

  async function saveImage(isFavicon) {
    const selected = isFavicon ? faviconFile : logoFile;
    if (!selected || !token || saving || loading) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const url = await uploadImage(selected);
      const data = await saveBranding(url, isFavicon);

      if (isFavicon) {
        const savedUrl = data.faviconUrl || url;
        setFaviconUrl(savedUrl);
        setFaviconFile(null);
        applySiteFavicon(savedUrl);
        setMessage("Website favicon saved successfully.");
      } else {
        setLogoUrl(data.logoUrl || url);
        setLogoFile(null);
        setMessage("Website logo saved successfully.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteImage(isFavicon) {
    const currentUrl = isFavicon ? faviconUrl : logoUrl;

    if (!currentUrl || !token || saving || loading) return;

    const label = isFavicon ? "favicon" : "logo";

    if (!window.confirm(
      `Delete current website ${label}?`
    )) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await saveBranding("", isFavicon);

      if (isFavicon) {
        setFaviconUrl("");
        setFaviconFile(null);
        applySiteFavicon("");
      } else {
        setLogoUrl("");
        setLogoFile(null);
      }

      setMessage(`Website ${label} removed successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <main className="maxab-logo-page">
        <h2>Admin Login Required</h2>
        <a href="/admin/login">Go to Admin Login</a>
      </main>
    );
  }

  return (
    <main className="maxab-logo-page">
      <div className="maxab-logo-container">
        <a
          href="/admin/dashboard"
          className="maxab-logo-back"
        >
          <ArrowLeft size={17}/>
          Back to Dashboard
        </a>

        <div className="maxab-logo-heading">
          <span>MAXPRODUCT BRAND SETTINGS</span>
          <h1>Website Logo & Favicon</h1>
          <p>
            Manage your website logo and browser tab icon.
          </p>
        </div>

        {error && (
          <p className="maxab-logo-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="maxab-logo-success" role="status">
            {message}
          </p>
        )}

        <div className="maxab-logo-card">
          <h2>Website Logo</h2>

          <div className="maxab-logo-preview">
            {(logoPreview || logoUrl) ? (
              <img
                src={logoPreview || logoUrl}
                alt="MAXPRODUCT website logo preview"
              />
            ) : (
              <div className="maxab-logo-placeholder">
                <Image size={32}/>
                <span>No logo uploaded yet</span>
              </div>
            )}
          </div>

          <label className="maxab-logo-file">
            <Upload size={19}/>
            <span>
              {logoFile ? logoFile.name : "Choose New Logo"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={event => chooseImage(event, "logo")}
              disabled={saving || loading}
            />
          </label>

          <p className="maxab-logo-hint">
            Recommended: Transparent PNG or WebP.
            Maximum file size: 5 MB.
          </p>

          <div className="maxproduct-brand-actions">
            <button
              type="button"
              className="maxab-logo-save"
              disabled={!logoFile || saving || loading}
              onClick={() => saveImage(false)}
            >
              <Save size={18}/>
              {saving ? "Processing..." : "Save Website Logo"}
            </button>

            {Boolean(logoUrl) && (
              <button
                type="button"
                className="maxab-logo-delete"
                disabled={saving || loading}
                onClick={() => deleteImage(false)}
              >
                <Trash2 size={17}/>
                Delete Logo
              </button>
            )}
          </div>
        </div>

        <div className="maxab-logo-card maxproduct-favicon-card">
          <h2>
            <Globe size={21}/>
            Website Favicon
          </h2>

          <p className="maxproduct-favicon-description">
            Upload the small icon displayed in browser tabs.
          </p>

          <div className="maxproduct-favicon-preview">
            {(faviconPreview || faviconUrl) ? (
              <img
                src={faviconPreview || faviconUrl}
                alt="Current website favicon"
              />
            ) : (
              <div className="maxproduct-favicon-empty">
                <Globe size={28}/>
                <span>No favicon uploaded</span>
              </div>
            )}
          </div>

          <label className="maxab-logo-file">
            <Upload size={19}/>
            <span>
              {faviconFile
                ? faviconFile.name
                : "Choose Favicon Image"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={event => chooseImage(event, "favicon")}
              disabled={saving || loading}
            />
          </label>

          <p className="maxab-logo-hint">
            Recommended: Square PNG, 512 × 512 px.
            Maximum file size: 5 MB.
          </p>

          <div className="maxproduct-brand-actions">
            <button
              type="button"
              className="maxab-logo-save"
              disabled={!faviconFile || saving || loading}
              onClick={() => saveImage(true)}
            >
              <Save size={18}/>
              {saving ? "Processing..." : "Save Favicon"}
            </button>

            {Boolean(faviconUrl) && (
              <button
                type="button"
                className="maxab-logo-delete"
                disabled={saving || loading}
                onClick={() => deleteImage(true)}
              >
                <Trash2 size={17}/>
                Delete Favicon
              </button>
            )}
          </div>
        </div>

        {loading && <p>Loading brand settings...</p>}
      </div>
    </main>
  );
}
