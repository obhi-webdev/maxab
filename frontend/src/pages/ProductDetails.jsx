import { trackMetaEvent, metaProductData } from "../services/metaPixel";
import { useEffect, useState } from "react";
import {
  ChevronRight, ChevronLeft, Plus, Minus,
  ShoppingCart, Zap, Check, ShieldCheck,
  Truck, Headphones, Package, Tag
} from "lucide-react";

import { useCart } from "../context/CartContext";
import CartDrawer from "../components/cart/CartDrawer";
import SEO from "../components/seo/SEO";

import "../styles/productDetails.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

const money = value =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

export default function ProductDetails() {
  const slug = decodeURIComponent(
    window.location.pathname
      .split("/")
      .filter(Boolean)
      .pop() || ""
  );

  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product?._id) return;

    const sendView = () => {
      trackMetaEvent(
        "ViewContent",
        metaProductData(product)
      );
    };

    sendView();

    window.addEventListener(
      "maxproduct-meta-consent-change",
      sendView
    );

    return () => window.removeEventListener(
      "maxproduct-meta-consent-change",
      sendView
    );
  }, [product]);



  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const response = await fetch(`${API}/products`);

        if (!response.ok) {
          throw new Error("Could not load products");
        }

        const result = await response.json();

        const found = (result.data || []).find(
          item =>
            item.slug === slug ||
            String(item._id || item.id) === slug
        );

        if (!found) {
          throw new Error("Product not found");
        }

        if (alive) {
          setProduct(found);
          setActiveImage(0);
          setQuantity(1);
        }
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="maxab-pdp-state">
        <div className="maxab-pdp-spinner"/>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="maxab-pdp-state">
        <Package size={44}/>
        <h2>{error || "Product unavailable"}</h2>
        <a href="/">Back to MAXPRODUCT</a>
      </div>
    );
  }

  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  const stock = Math.max(0, Number(product.stock || 0));
  const maxQuantity = Math.max(1, Math.min(stock, 20));
  const inStock = stock > 0;

  const price = Number(product.price || 0);
  const oldPrice = Number(product.oldPrice || 0);

  const discount = oldPrice > price && price > 0
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  const cartProduct = {
    ...product,
    id: product._id,
    image: images[0] || ""
  };

  function addQuantity() {
    if (!inStock) return;

    addToCart({ ...cartProduct, quantity });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function buyNow() {
    if (!inStock) return;

    addToCart({ ...cartProduct, quantity });

    window.location.assign("/checkout");
  }

  function changeImage(direction) {
    if (!images.length) return;

    setActiveImage(current =>
      (current + direction + images.length) % images.length
    );
  }

  return (
    <div className="maxab-pdp-page">
      <SEO
        title={`${product.name} | MAXPRODUCT`}
        description={
          (product.description || `Buy ${product.name} from MAXPRODUCT.`)
            .slice(0, 160)
        }
        image={images[0] || ""}
      />

      <main className="maxab-pdp-container">

        <nav className="maxab-pdp-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <ChevronRight size={15}/>
          <a href="/#shop">{product.category || "Products"}</a>
          <ChevronRight size={15}/>
          <span>{product.name}</span>
        </nav>

        <div className="maxab-pdp-product">

          {/* LEFT: PRODUCT GALLERY */}
          <section className="maxab-pdp-gallery">
            <div className="maxab-pdp-main-image">

              <div className="maxab-pdp-badges">
                {discount > 0 && (
                  <span className="maxab-pdp-badge-offer">
                    {discount}% OFF
                  </span>
                )}
                {product.featured && (
                  <span className="maxab-pdp-badge-featured">
                    FEATURED
                  </span>
                )}
              </div>

              {images.length ? (
                <img
                  src={images[activeImage]}
                  alt={`${product.name} - image ${activeImage + 1}`}
                  fetchPriority="high"
                />
              ) : (
                <div className="maxab-pdp-image-placeholder">
                  <Package size={70} strokeWidth={1}/>
                  <span>Product Image Coming Soon</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    className="maxab-pdp-image-arrow previous"
                    onClick={() => changeImage(-1)}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20}/>
                  </button>

                  <button
                    className="maxab-pdp-image-arrow next"
                    onClick={() => changeImage(1)}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20}/>
                  </button>
                </>
              )}

              {images.length > 0 && (
                <span className="maxab-pdp-image-count">
                  {activeImage + 1} / {images.length}
                </span>
              )}
            </div>

            {images.length > 0 && (
              <>
                <div className="maxab-pdp-thumbnails">
                  {images.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      className={index === activeImage ? "selected" : ""}
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={src}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                <p className="maxab-pdp-image-hint">
                  Select an image to view
                </p>
              </>
            )}
          </section>

          {/* RIGHT: PRODUCT INFORMATION */}
          <section className="maxab-pdp-information">

            <div className="maxab-pdp-category">
              <Tag size={15}/>
              {product.category || "MAXPRODUCT COLLECTION"}
            </div>

            <h1>{product.name}</h1>

            <div className="maxab-pdp-meta">
              <span>
                SKU: {product.sku || product.slug || "MAXPRODUCT"}
              </span>
              <span className="maxab-pdp-meta-separator">•</span>
              <span>{product.category || "Products"}</span>
            </div>

            <div className="maxab-pdp-divider"/>

            <div className="maxab-pdp-pricing">
              <strong>{money(price)}</strong>

              {oldPrice > price && (
                <del>{money(oldPrice)}</del>
              )}

              {discount > 0 && (
                <span className="maxab-pdp-save">
                  Save {discount}%
                </span>
              )}
            </div>

            <div className="maxab-pdp-divider"/>

            <div className="maxab-pdp-stock-row">
              <span className={
                inStock
                  ? "maxab-pdp-stock available"
                  : "maxab-pdp-stock unavailable"
              }>
                {inStock
                  ? `In Stock — ${stock} available`
                  : "Out of Stock"}
              </span>
            </div>

            <p className="maxab-pdp-description">
              {product.description ||
                "Discover this quality product at MAXPRODUCT. Shop with confidence and enjoy convenient home delivery."}
            </p>

            <div className="maxab-pdp-quantity-section">
              <label>Quantity</label>

              <div className="maxab-pdp-quantity">
                <button
                  disabled={!inStock || quantity <= 1}
                  onClick={() =>
                    setQuantity(q => Math.max(1, q - 1))
                  }
                  aria-label="Decrease quantity"
                >
                  <Minus size={17}/>
                </button>

                <span>{quantity}</span>

                <button
                  disabled={!inStock || quantity >= maxQuantity}
                  onClick={() =>
                    setQuantity(q => Math.min(maxQuantity, q + 1))
                  }
                  aria-label="Increase quantity"
                >
                  <Plus size={17}/>
                </button>
              </div>

              <small>
                {inStock
                  ? `Maximum ${maxQuantity} items per order`
                  : "Currently unavailable"}
              </small>
            </div>

            <div className="maxab-pdp-actions">
              <button
                className="maxab-pdp-add"
                disabled={!inStock}
                onClick={addQuantity}
              >
                {added
                  ? <Check size={19}/>
                  : <ShoppingCart size={19}/>}
                {added ? "Added to Cart" : "Add to Cart"}
              </button>

              <button
                className="maxab-pdp-buy"
                disabled={!inStock}
                onClick={buyNow}
              >
                <Zap size={19}/>
                Buy Now
              </button>
            </div>

            <div className="maxab-pdp-benefits">
              <div>
                <Truck size={22}/>
                <span>Home Delivery</span>
              </div>
              <div>
                <ShieldCheck size={22}/>
                <span>Cash on Delivery</span>
              </div>
              <div>
                <Headphones size={22}/>
                <span>Customer Support</span>
              </div>
            </div>

          </section>
        </div>

        {product.description && (
          <section className="maxab-pdp-description-panel">
            <div className="maxab-pdp-description-tab">
              Product Description
            </div>
            <div className="maxab-pdp-description-content">
              <h2>About This Product</h2>
              <p>{product.description}</p>
            </div>
          </section>
        )}

      </main>

      <CartDrawer/>
    </div>
  );
}
