import {
  getMetaConsent,
  setMetaConsent,
  trackMetaEvent,
  trackMetaPurchase
} from "../services/metaPixel";
import { CartProvider } from "../context/CartContext";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { useEffect, useRef, useState } from "react";
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

  const [orderCustomer, setOrderCustomer] = useState({
    name: "",
    phone: "",
    district: "",
    address: "",
    deliveryArea: "inside"
  });
  const [orderSending, setOrderSending] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [videoError, setVideoError] = useState(false);

  const [marketingConsent, setMarketingConsent] = useState(getMetaConsent);
  const trackedContent = useRef(new Set());
  const checkoutTracked = useRef(false);



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

  useEffect(() => {
    function syncConsent() {
      setMarketingConsent(getMetaConsent());
    }

    window.addEventListener("maxproduct-meta-consent-change", syncConsent);

    return () => {
      window.removeEventListener("maxproduct-meta-consent-change", syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!page?._id || !marketingConsent) return;

    const id = String(page._id);
    if (trackedContent.current.has(id)) return;
    trackedContent.current.add(id);

    trackMetaEvent("ViewContent", {
      content_ids: [id],
      content_type: "product",
      content_name: page.title,
      contents: [{
        id,
        quantity: 1,
        item_price: Number(page.pricing?.salePrice || 0)
      }],
      currency: "BDT",
      value: Number(page.pricing?.salePrice || 0)
    }).then(success => {
      if (!success) trackedContent.current.delete(id);
    }).catch(() => {
      trackedContent.current.delete(id);
    });
  }, [page, marketingConsent]);


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

  const delivery = {
    ...(page.delivery || {}),
    freeDelivery: true,
    insideDhaka: 0,
    outsideDhaka: 0
  };
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



  function startCheckoutTracking() {
    if (checkoutTracked.current || !getMetaConsent()) return;

    checkoutTracked.current = true;

    trackMetaEvent("InitiateCheckout", {
      content_ids: [String(page._id)],
      content_type: "product",
      currency: "BDT",
      value: Number(page.pricing?.salePrice || 0) * quantity,
      num_items: quantity
    });
  }

  function updateOrderCustomer(key, value) {
    setOrderCustomer(current => ({ ...current, [key]: value }));
  }


  function embedVideoUrl(url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname;

      const facebookHosts = [
        "facebook.com",
        "www.facebook.com",
        "m.facebook.com",
        "web.facebook.com"
      ];

      if (facebookHosts.includes(host)) {
        const isFacebookVideo =
          pathname.startsWith("/reel/") ||
          pathname.startsWith("/videos/") ||
          pathname.includes("/videos/") ||
          pathname.startsWith("/watch");

        if (isFacebookVideo) {
          const clean = new URL(
            pathname,
            "https://www.facebook.com"
          );

          if (pathname.startsWith("/watch")) {
            const videoId = parsed.searchParams.get("v");
            if (videoId) {
              clean.searchParams.set("v", videoId);
            }
          }

          const embed = new URL(
            "https://www.facebook.com/plugins/video.php"
          );

          embed.searchParams.set("href", clean.toString());
          embed.searchParams.set("show_text", "false");
          embed.searchParams.set("allowfullscreen", "true");
          embed.searchParams.set("width", "560");
          embed.searchParams.set("autoplay", "false");

          return embed.toString();
        }
      }
    } catch {
      return "";
    }

    return youtubeEmbed(url);
  }

  function youtubeEmbed(url) {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      let id = "";

      if (hostname === "youtu.be" || hostname === "www.youtu.be") {
        id = parsed.pathname.slice(1).split("/")[0];
      } else if (
        ["youtube.com", "www.youtube.com", "m.youtube.com",
         "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(hostname)
      ) {
        id = parsed.searchParams.get("v") || "";
        if (!id) {
          const match = parsed.pathname.match(
            /^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/
          );
          id = match?.[1] || "";
        }
      }

      if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&playsinline=1`;
      }
    } catch {
      return "";
    }

    return "";
  }

  async function submitLandingOrder(event) {
    event.preventDefault();

    if (orderSending || orderSuccess) return;

    setOrderError("");
    setOrderSending(true);

    try {
      const storageKey = `MAXPRODUCT-lp-order-${slug}`;
      let requestId = sessionStorage.getItem(storageKey);

      if (!requestId) {
        requestId = crypto.randomUUID();
        sessionStorage.setItem(storageKey, requestId);
      }

      const response = await fetch(
        `${API}/landing-pages/public/${encodeURIComponent(slug)}/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientRequestId: requestId,
            quantity,
            customer: orderCustomer,
            marketingConsent: getMetaConsent()
          })
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Order submission failed");
      }

      setOrderSuccess(result.data);

      if (!result.duplicate && getMetaConsent()) {
        trackMetaPurchase(result.data).catch(error => {
          console.warn("Landing Purchase Pixel error:", error.message);
        });
      }

      sessionStorage.removeItem(storageKey);
    } catch (error) {
      setOrderError(error.message || "Please try again");
    } finally {
      setOrderSending(false);
    }
  }

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
                এখনই অর্ডার করুন
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
                embedVideoUrl(page.video.url) ? (
                  <iframe
                    className={
                      page.video.url.includes("facebook.com/reel/")
                        ? "mpl-gallery-video-player mpl-facebook-reel"
                        : "mpl-gallery-video-player"
                    }
                    title={`${page.title} product video`}
                    src={embedVideoUrl(page.video.url)}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <>
                    <video
                      key={page.video.url}
                      src={page.video.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      preload="auto"
                      poster={images[0]?.url || undefined}
                      onError={() => setVideoError(true)}
                      onLoadedData={() => setVideoError(false)}
                      aria-label={`${page.title} product video`}
                    />
                    {videoError && (
                      <div className="mpl-video-error">
                        ভিডিওটি চালু করা যাচ্ছে না।
                        Dashboard-এর Video URL এবং MP4 Format পরীক্ষা করুন।
                      </div>
                    )}
                  </>
                )
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
          <div className="mpl-container">
            <div className="mpl-section-heading">
              <span>SECURE CHECKOUT</span>
              <h2>আপনার অর্ডার সম্পন্ন করুন</h2>
              <p>সঠিক তথ্য দিয়ে ক্যাশ অন ডেলিভারি অর্ডার করুন।</p>
            </div>

            {orderSuccess ? (
              <div className="mpl-order-success">
                <Check size={42}/>
                <h2>আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!</h2>
                <p>অর্ডার নম্বর: <strong>{orderSuccess.orderNumber}</strong></p>
                <p>সর্বমোট: <strong>{money(orderSuccess.total)}</strong></p>
                <p>স্ট্যাটাস: Pending Confirmation</p>
                <a href="/">ওয়েবসাইটে ফিরে যান</a>
              </div>
            ) : (
              <form
                className="mpl-checkout-grid"
                onSubmit={submitLandingOrder}
                onFocusCapture={startCheckoutTracking}
              >
                <div className="mpl-checkout-panel">
                  <h3>Customer Information</h3>

                  <label className="mpl-checkout-field">
                    আপনার নাম *
                    <input
                      required
                      minLength={2}
                      maxLength={120}
                      value={orderCustomer.name}
                      onChange={e => updateOrderCustomer("name", e.target.value)}
                      placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                    />
                  </label>

                  <label className="mpl-checkout-field">
                    আপনার মোবাইল নাম্বার *
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      pattern="(?:\+?88)?01[3-9][0-9]{8}"
                      value={orderCustomer.phone}
                      onChange={e => updateOrderCustomer("phone", e.target.value)}
                      placeholder="01XXXXXXXXX"
                    />
                  </label>

                  <label className="mpl-checkout-field">
                    আপনার জেলা *
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={orderCustomer.district}
                      onChange={e => updateOrderCustomer("district", e.target.value)}
                      placeholder="জেলার নাম লিখুন"
                    />
                  </label>

                  <label className="mpl-checkout-field">
                    আপনার সম্পূর্ণ ঠিকানা *
                    <textarea
                      required
                      minLength={8}
                      maxLength={500}
                      rows={4}
                      value={orderCustomer.address}
                      onChange={e => updateOrderCustomer("address", e.target.value)}
                      placeholder="বাসা, রোড, এলাকা, থানা ও পরিচিত স্থান"
                    />
                  </label>

                  <fieldset className="mpl-checkout-delivery">
                    <legend>ডেলিভারি লোকেশন নির্বাচন করুন *</legend>

                    <label>
                      <input
                        type="radio"
                        name="landingDelivery"
                        value="inside"
                        checked={orderCustomer.deliveryArea === "inside"}
                        onChange={e => updateOrderCustomer(
                          "deliveryArea", e.target.value
                        )}
                      />
                      <span>ঢাকা সিটির মধ্যে</span>
                      <strong>{money(delivery?.freeDelivery
                        ? 0 : delivery?.insideDhaka)}</strong>
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="landingDelivery"
                        value="outside"
                        checked={orderCustomer.deliveryArea === "outside"}
                        onChange={e => updateOrderCustomer(
                          "deliveryArea", e.target.value
                        )}
                      />
                      <span>ঢাকা সিটির বাইরে</span>
                      <strong>{money(delivery?.freeDelivery
                        ? 0 : delivery?.outsideDhaka)}</strong>
                    </label>
                  </fieldset>
                </div>

                <aside className="mpl-checkout-panel mpl-checkout-summary">
                  <h3>আপনার অর্ডার</h3>

                  <div className="mpl-checkout-product">
                    {images[0] && (
                      <img src={images[0].url} alt={page.title}/>
                    )}
                    <div>
                      <strong>{page.title}</strong>
                      <small>Quantity: {quantity}</small>
                    </div>
                  </div>

                  <div className="mpl-checkout-total">
                    <span>Product Subtotal</span>
                    <strong>{money(selling * quantity)}</strong>
                  </div>

                  <div className="mpl-checkout-total">
                    <span>Delivery Charge</span>
                    <strong>{money(
                      delivery?.freeDelivery ? 0 :
                      orderCustomer.deliveryArea === "inside"
                        ? delivery?.insideDhaka
                        : delivery?.outsideDhaka
                    )}</strong>
                  </div>

                  <div className="mpl-checkout-total mpl-checkout-grand">
                    <span>মোট মূল্য</span>
                    <strong>{money(
                      selling * quantity +
                      (delivery?.freeDelivery ? 0 :
                        Number(orderCustomer.deliveryArea === "inside"
                          ? delivery?.insideDhaka || 0
                          : delivery?.outsideDhaka || 0))
                    )}</strong>
                  </div>

                  <div className="mpl-checkout-cod">
                    <LockKeyhole size={19}/>
                    Cash on Delivery
                  </div>


                  <label style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9,
                    fontSize: 12,
                    lineHeight: 1.6,
                    marginBottom: 16
                  }}>
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={event => {
                        const allowed = event.target.checked;
                        setMarketingConsent(allowed);
                        setMetaConsent(allowed);
                      }}
                    />
                    <span>
                      I agree to optional Meta marketing conversion tracking
                      for this order.
                    </span>
                  </label>

                  {orderError && (
                    <p role="alert" className="mpl-checkout-error">
                      {orderError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="mpl-checkout-submit"
                    disabled={orderSending || !delivery?.cashOnDelivery}
                  >
                    {orderSending
                      ? "অর্ডার সাবমিট হচ্ছে..."
                      : "অর্ডার কনফার্ম করুন"}
                  </button>

                  <small>
                    অর্ডারটি আমাদের টিম নিশ্চিত করার পর প্রক্রিয়াকরণ করা হবে।
                  </small>
                </aside>
              </form>
            )}
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
          অর্ডার করুন <ArrowRight size={17}/>
        </span>
      </a>
    </div>
    </CartProvider>
  );
}
