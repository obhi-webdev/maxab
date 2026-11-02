import { CartProvider } from "../context/CartContext";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Heart,
  PackageCheck,
  CreditCard,
  ZoomIn,
  X,
  Play,
  Minus,
  Plus,
  Sparkles,
  LockKeyhole,
} from "lucide-react";

import "./dynamicLandingPage.css";

const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

const money = (number) =>
  `৳${Number(number || 0).toLocaleString("en-BD")}`;

const moneyValue = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

export default function DynamicLandingPage() {
  const slug = window.location.pathname
    .replace(/^\/lp\//, "")
    .replace(/\/$/, "");

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadPage() {
      try {
        const response = await fetch(
          `${API}/landing-pages/public/${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Page not available");
        }

        if (active) {
          setPage(result.data);
          setError("");
        }
      } catch (err) {
        if (active && err.name !== "AbortError") {
          setError(err.message || "Unable to load product");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
      controller.abort();
    };
  }, [slug]);

  useEffect(() => {
    if (!page) return;

    const previousTitle = document.title;

    document.title =
      page.seo?.metaTitle ||
      `${page.title} | MAXPRODUCT`;

    return () => {
      document.title = previousTitle;
    };
  }, [page]);

  useEffect(() => {
    if (!zoomOpen) return;

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setZoomOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () =>
      window.removeEventListener("keydown", closeOnEscape);
  }, [zoomOpen]);

  if (loading) {
    return (
      <main className="mpl-state">
        <div className="mpl-loader" />
        <p>Product loading...</p>
      </main>
    );
  }

  if (!page || error) {
    return (
      <main className="mpl-state">
        <h1>Product Page Unavailable</h1>
        <p>{error || "This page could not be found."}</p>
        <a href="/">Back to MAXPRODUCT</a>
      </main>
    );
  }

  const images = (page.images || [])
    .filter((image) => typeof image.url === "string" && image.url)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const currentImage =
    images[activeImage] || images[0];

  const selling = moneyValue(page.pricing?.salePrice);
  const regular = moneyValue(page.pricing?.regularPrice);
  const hasDiscount = regular > selling && selling > 0;
  const discount = hasDiscount
    ? Math.round(((regular - selling) / regular) * 100)
    : 0;

  const delivery = page.delivery || {};
  const features = (page.features || [])
    .filter(Boolean);

  const featureIcons = [
    BadgeCheck,
    Heart,
    ShieldCheck,
    PackageCheck,
    Sparkles,
    Truck,
  ];

  function selectRelativeImage(direction) {
    if (!images.length) return;

    setActiveImage((current) =>
      (current + direction + images.length) % images.length
    );
  }

  const featureTitle = [
    "Premium Quality",
    "Trusted Shopping",
    "Cash on Delivery",
    "Nationwide Delivery",
  ];

  return (
    <CartProvider>
    <div className="mpl-page">
      <Header />

      <main>
        <section className="mpl-hero" id="product">
          <div className="mpl-container mpl-hero-grid">
            <div className="mpl-hero-visual">
              <div className="mpl-hero-image-frame">
                {currentImage ? (
                  <img
                    src={currentImage.url}
                    alt={currentImage.alt || page.title}
                    className="mpl-hero-img"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="mpl-no-image">
                    Product Image
                  </div>
                )}

                {hasDiscount && (
                  <div className="mpl-image-discount">
                    {discount}% OFF
                  </div>
                )}

                <div className="mpl-image-label">
                  <span className="mpl-image-label-icon">
                    <Check size={20} />
                  </span>
                  <div>
                    <strong>Premium Collection</strong>
                    <small>Selected for everyday use</small>
                  </div>
                </div>
              </div>

              {images.length > 1 && (
                <div className="mpl-hero-thumbs">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={`${image.url}-${index}`}
                      className={activeImage === index ? "active" : ""}
                      onClick={() => setActiveImage(index)}
                      aria-label={`View product image ${index + 1}`}
                    >
                      <img src={image.url} alt={`View ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}



            </div>

            <div className="mpl-hero-content">
              <div className="mpl-pill">
                <Sparkles size={15} />
                MAXPRODUCT EXCLUSIVE
              </div>

              <h1>{page.title}</h1>

              {page.subtitle && (
                <p className="mpl-subtitle">{page.subtitle}</p>
              )}

              <div className="mpl-price-row">
                <strong>{money(selling)}</strong>
                {hasDiscount && (
                  <>
                    <del>{money(regular)}</del>
                    <span className="mpl-save">
                      SAVE {money(regular - selling)}
                    </span>
                  </>
                )}
              </div>

              <p className="mpl-price-help">
                সহজ অর্ডার, স্বচ্ছ মূল্য এবং নির্ধারিত ডেলিভারি চার্জ।
              </p>

              <div className="mpl-trust-grid">
                {[
                  delivery.cashOnDelivery && "Cash on Delivery",
                  delivery.freeDelivery ? "Free Delivery" : "Delivery Available",
                  "Secure Product Information",
                  "Simple Shopping Experience",
                ].filter(Boolean).map((item) => (
                  <div className="mpl-trust" key={item}>
                    <span><Check size={14}/></span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mpl-action-row">
                <div className="mpl-quantity">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Minus size={17} />
                  </button>
                  <strong>{quantity}</strong>
                  <button
                    type="button"
                    disabled={quantity >= 10}
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(q => Math.min(10, q + 1))}
                  >
                    <Plus size={17} />
                  </button>
                </div>

                <a className="mpl-outline-btn" href="#gallery">
                  <ZoomIn size={17}/>
                  ছবিগুলো দেখুন
                </a>
              </div>

              <a className="mpl-primary-btn" href="#order-information">
                অর্ডার সংক্রান্ত তথ্য
                <ArrowRight size={19} />
              </a>

              <p className="mpl-helper">
                {delivery.cashOnDelivery
                  ? "Cash on Delivery সুবিধা সক্রিয় আছে।"
                  : "পেমেন্ট পদ্ধতি সম্পর্কে বিস্তারিত নিচে দেখুন।"}
              </p>
            </div>
          </div>
        </section>


        <section className="mpl-gallery-section" id="gallery">
          <div className="mpl-container">

            <div className="mpl-section-heading">
              <span>PRODUCT VIDEO</span>
              <h2>ভিডিওতে প্রোডাক্টটি কাছ থেকে দেখুন</h2>
              <p>
                ভিডিও দেখে প্রোডাক্টের ডিজাইন ও বিস্তারিত জানুন।
              </p>
            </div>

            <div className="mpl-gallery-video-wrap">
              {page.video?.url ? (
                <video
                  key={page.video.url}
                  src={page.video.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  poster={images[0]?.url || undefined}
                  aria-label={`${page.title} product video`}
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="mpl-gallery-video-empty">
                  <strong>Product Video Coming Soon</strong>
                  <p>
                    এই প্রোডাক্টের ভিডিও এখনো যোগ করা হয়নি।
                  </p>
                </div>
              )}
            </div>

          </div>
        </section>


        <section className="mpl-features-section" id="features">
          <div className="mpl-container mpl-features-grid">
            <div className="mpl-features-copy">
              <span className="mpl-eyebrow">PRODUCT DETAILS</span>
              <h2>আপনার পছন্দের প্রোডাক্টের বিস্তারিত</h2>
              <p>
                {page.description ||
                  "প্রোডাক্টের বিস্তারিত তথ্য Dashboard থেকে যোগ করা যাবে।"}
              </p>
            </div>

            <div className="mpl-feature-cards">
              {(features.length ? features : featureTitle).map(
                (feature, index) => {
                  const Icon = featureIcons[index % featureIcons.length];

                  return (
                    <article className="mpl-feature-card" key={index}>
                      <span><Icon size={22}/></span>
                      <strong>{feature}</strong>
                    </article>
                  );
                }
              )}
            </div>
          </div>
        </section>

        <section className="mpl-benefits-section">
          <div className="mpl-container mpl-benefit-strip">
            {[
              { icon: BadgeCheck, label: "Product Information" },
              { icon: Truck, label: delivery.freeDelivery ? "Free Delivery" : "Delivery Options" },
              { icon: CreditCard, label: "Clear Pricing" },
              { icon: ShieldCheck, label: delivery.cashOnDelivery ? "Cash on Delivery" : "Payment Information" },
            ].map(({ icon: Icon, label }) => (
              <div key={label}>
                <span><Icon size={22}/></span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="mpl-order-section" id="order-information">
          <div className="mpl-container mpl-order-card">
            <div>
              <span className="mpl-eyebrow">ORDER INFORMATION</span>
              <h2>{page.title}</h2>
              <p>
                {delivery.cashOnDelivery
                  ? "এই প্রোডাক্টের জন্য Cash on Delivery সক্রিয় রয়েছে।"
                  : "এই প্রোডাক্টের জন্য Cash on Delivery সক্রিয় নেই।"}
              </p>
              <p className="mpl-order-delivery">
                {delivery.freeDelivery
                  ? "ডেলিভারি চার্জ: সম্পূর্ণ ফ্রি"
                  : `ঢাকার ভেতরে ${money(delivery.insideDhaka)} | ঢাকার বাইরে ${money(delivery.outsideDhaka)}`}
              </p>
            </div>

            <div className="mpl-order-summary">
              <span>Quantity: {quantity}</span>
              <strong>{money(selling * quantity)}</strong>
              <small>ডেলিভারি চার্জ প্রযোজ্য হলে আলাদা যোগ হবে।</small>
              <div className="mpl-unavailable">
                অনলাইন অর্ডার ফর্ম এখনো সংযুক্ত হয়নি।
                অর্ডার চালু হলে এখান থেকেই Checkout করা যাবে।
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {zoomOpen && currentImage && (
        <div
          className="mpl-lightbox"
          role="presentation"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            aria-label="Close image zoom"
            onClick={() => setZoomOpen(false)}
          >
            <X size={23}/>
          </button>
          <img
            src={currentImage.url}
            alt={currentImage.alt || page.title}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      <a className="mpl-mobile-sticky" href="#order-information">
        <span>
          <small>Product Price</small>
          <strong>{money(selling)}</strong>
        </span>
        <span className="mpl-mobile-sticky-action">
          অর্ডার তথ্য <ArrowRight size={17}/>
        </span>
      </a>
    </div>
    </CartProvider>
  );
}
