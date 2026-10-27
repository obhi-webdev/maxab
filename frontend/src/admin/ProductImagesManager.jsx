import { useEffect, useState } from "react";
import {
  ArrowLeft, UploadCloud, Trash2,
  ImagePlus, ArrowUp, ArrowDown, Save
} from "lucide-react";
import "./productImagesManager.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');
const MAX_IMAGES = 12;

export default function ProductImagesManager() {
  const token = sessionStorage.getItem("maxab-admin-token");

  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState("");
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const product = products.find(item => item._id === selected);

  useEffect(() => {
    if (!token) return;

    fetch(`${API}/products/admin/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || "Unable to load products");
        }
        setProducts(body.data || []);
      })
      .catch(err => setError(err.message));
  }, [token]);

  useEffect(() => {
    setImages(product?.images || []);
    setFiles([]);
    setError("");
    setNotice("");
  }, [selected, products]);

  useEffect(() => {
    return () => {
      files.forEach(item => URL.revokeObjectURL(item.preview));
    };
  }, [files]);

  function selectFiles(event) {
    const picked = Array.from(event.target.files || []);
    if (!picked.length) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (
      picked.some(file =>
        !allowed.includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
    ) {
      setError("Only JPG, PNG or WebP images under 5MB are allowed.");
      event.target.value = "";
      return;
    }

    if (images.length + files.length + picked.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images per product.`);
      event.target.value = "";
      return;
    }

    setFiles(current => [
      ...current,
      ...picked.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: crypto.randomUUID()
      }))
    ]);

    setError("");
    setNotice("");
    event.target.value = "";
  }

  function removeNew(id) {
    setFiles(current => current.filter(item => item.id !== id));
  }

  function removeExisting(index) {
    setImages(current => current.filter((_, i) => i !== index));
  }

  function moveImage(index, direction) {
    const target = index + direction;

    setImages(current => {
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  async function uploadOne(file) {
    const data = new FormData();
    data.append("image", file);

    const response = await fetch(`${API}/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: data
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body.data?.url) {
      throw new Error(body.message || `Upload failed: ${file.name}`);
    }

    return body.data.url;
  }

  async function save() {
    if (!selected || busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    const uploaded = [];

    try {
      // Upload sequentially to avoid overloading ImageKit.
      for (const item of files) {
        const url = await uploadOne(item.file);
        uploaded.push(url);
      }

      const finalImages = [...images, ...uploaded];

      const response = await fetch(
        `${API}/admin/product-images/${selected}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ images: finalImages })
        }
      );

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.message || "Unable to save gallery");
      }

      setProducts(current => current.map(item =>
        item._id === selected
          ? { ...item, images: body.data.images }
          : item
      ));

      setFiles([]);
      const warnings = body.data?.deleteWarnings || [];
      const deleted = body.data?.deletedFromImageKit?.length || 0;

      setNotice(
        `Product images saved. ${deleted} file(s) deleted from ImageKit.`
      );

      if (warnings.length) {
        setError(warnings.join(" "));
      }
    } catch (err) {
      // Keep uploaded URLs visible so retrying does not
      // need to upload the same files again.
      if (uploaded.length) {
        setImages(current => [...current, ...uploaded]);
        setFiles(current => current.slice(uploaded.length));
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="maxab-images-page">
        <div className="maxab-images-panel">
          <h2>Admin Login Required</h2>
          <a href="/admin/login">Login to MAXAB</a>
        </div>
      </div>
    );
  }

  return (
    <div className="maxab-images-page">
      <main className="maxab-images-container">

        <a href="/admin/dashboard" className="maxab-images-back">
          <ArrowLeft size={17}/> Back to Dashboard
        </a>

        <div className="maxab-images-heading">
          <span>MAXAB PRODUCT MANAGEMENT</span>
          <h1>Product Image Gallery</h1>
          <p>
            Upload multiple product images, remove photos,
            and choose the main product image.
          </p>
        </div>

        {error && <div className="maxab-images-error">{error}</div>}
        {notice && <div className="maxab-images-notice">{notice}</div>}

        <section className="maxab-images-panel">
          <label className="maxab-images-label">Select Product</label>

          <select
            className="maxab-images-select"
            value={selected}
            disabled={busy}
            onChange={event => setSelected(event.target.value)}
          >
            <option value="">Choose a product...</option>
            {products.map(item => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </section>

        {selected && product && (
          <>
            <section className="maxab-images-panel">
              <div className="maxab-images-section-title">
                <div>
                  <h2>Current Images</h2>
                  <p>
                    The first image is the main product image.
                  </p>
                </div>
                <span>{images.length + files.length}/{MAX_IMAGES}</span>
              </div>

              <div className="maxab-images-grid">
                {images.map((url, index) => (
                  <div className="maxab-image-item" key={`${url}-${index}`}>
                    <img src={url} alt={`${product.name} ${index + 1}`}/>

                    {index === 0 && (
                      <span className="maxab-main-image-tag">
                        MAIN IMAGE
                      </span>
                    )}

                    <div className="maxab-image-actions">
                      <button
                        disabled={busy || index === 0}
                        onClick={() => moveImage(index, -1)}
                        title="Move left"
                        aria-label="Move image left"
                      ><ArrowUp size={15}/></button>

                      <button
                        disabled={busy || index === images.length - 1}
                        onClick={() => moveImage(index, 1)}
                        title="Move right"
                        aria-label="Move image right"
                      ><ArrowDown size={15}/></button>

                      <button
                        disabled={busy}
                        onClick={() => removeExisting(index)}
                        title="Remove image"
                        aria-label="Remove image"
                      ><Trash2 size={15}/></button>
                    </div>
                  </div>
                ))}

                {files.map(item => (
                  <div className="maxab-image-item new" key={item.id}>
                    <img src={item.preview} alt={item.file.name}/>
                    <span className="maxab-new-image-tag">NEW</span>
                    <div className="maxab-image-actions">
                      <button
                        disabled={busy}
                        onClick={() => removeNew(item.id)}
                        aria-label="Remove selected file"
                      >
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <label className="maxab-upload-zone">
                <UploadCloud size={35}/>
                <strong>Select Multiple Images</strong>
                <span>
                  JPG, PNG, WebP · Max 5MB each · Up to 12 images
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy || images.length + files.length >= MAX_IMAGES}
                  onChange={selectFiles}
                />
              </label>

              <button
                className="maxab-save-images"
                onClick={save}
                disabled={busy || images.length + files.length > MAX_IMAGES}
              >
                <Save size={19}/>
                {busy ? "Uploading & Saving..." : "Save Product Gallery"}
              </button>

              <p className="maxab-images-note">
                Removing an image from the gallery removes its URL
                from the product, not the original ImageKit file.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
