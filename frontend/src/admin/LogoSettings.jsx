import { useEffect, useState } from "react";
import { ArrowLeft, Upload, Save, Image } from "lucide-react";
import "./logoSettings.css";

const API = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_URL || 'http://localhost:5001/api')
).replace(/\/$/, "");

export default function LogoSettings() {
  const [logoUrl, setLogoUrl] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  async function deleteLogo() {
    if (!logoUrl || saving || loading) return;

    if (!window.confirm(
      "Delete the current website logo? The default MAXAB logo will appear."
    )) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/site-branding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ logoUrl: "" })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete logo");
      }

      setLogoUrl("");
      setFile(null);
      setPreview("");
      setMessage("Website logo deleted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const token = sessionStorage.getItem("maxab-admin-token");

  useEffect(() => {
  
  if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API}/site-branding`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async response => {
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Cannot load logo");
        }

        setLogoUrl(result.data.logoUrl || "");
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (
      !["image/png", "image/jpeg", "image/webp"].includes(selected.type)
    ) {
      setError("Please select PNG, JPG or WebP image.");
      event.target.value = "";
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("Maximum image size is 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setMessage("");
    setFile(selected);
  }

  async function saveLogo() {
    if (!file || !token || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await fetch(
        `${API}/upload/product-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.data?.url) {
        throw new Error(
          uploadResult.message || "Image upload failed"
        );
      }

      const url = uploadResult.data.url;

      const saveResponse = await fetch(
        `${API}/site-branding`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ logoUrl: url })
        }
      );

      const saveResult = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(
          saveResult.message || "Could not save website logo"
        );
      }

      setLogoUrl(saveResult.data.logoUrl);
      setFile(null);
      setMessage("Website logo saved successfully!");
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
        <a href="/admin/dashboard" className="maxab-logo-back">
          <ArrowLeft size={17}/>
          Back to Dashboard
        </a>

        <div className="maxab-logo-heading">
          <span>MAXAB BRAND SETTINGS</span>
          <h1>Website Logo</h1>
          <p>
            Upload and manage your website's brand logo.
          </p>
        </div>

        <div className="maxab-logo-card">
          <h2>Current Logo</h2>

          <div className="maxab-logo-preview">
            {(preview || logoUrl) ? (
              <img
                src={preview || logoUrl}
                alt="MAXAB website logo preview"
              />
            ) : (
              <div className="maxab-logo-placeholder">
                <Image size={32}/>
                <span>No logo uploaded yet</span>
              </div>
            )}
          </div>

          {loading && <p>Loading current logo...</p>}

          {Boolean(logoUrl) && (
            <button
              type="button"
              className="maxab-logo-delete"
              onClick={deleteLogo}
              disabled={saving || loading}
            >
              Delete Logo
            </button>
          )}



          <label className="maxab-logo-file">
            <Upload size={19}/>
            <span>
              {file ? file.name : "Choose New Logo"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={selectFile}
              disabled={saving || loading}
            />
          </label>

          <p className="maxab-logo-hint">
            Recommended: Transparent PNG or WebP.
            Maximum file size: 5 MB.
          </p>

          {error && <p className="maxab-logo-error">{error}</p>}
          {message && <p className="maxab-logo-success">{message}</p>}

          <button
            type="button"
            className="maxab-logo-save"
            onClick={saveLogo}
            disabled={!file || saving || loading}
          >
            <Save size={18}/>
            {saving ? "Uploading & Saving..." : "Save Website Logo"}
          </button>
        </div>
      </div>
    </main>
  );
}
