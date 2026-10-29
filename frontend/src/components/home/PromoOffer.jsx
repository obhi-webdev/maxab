import { useEffect, useState } from "react";
import { ArrowRight, Flame, BadgePercent, ShoppingBag } from "lucide-react";
import "./promoOffer.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

export default function PromoOffer() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    let mounted = true;

    fetch(`${API}/products`)
      .then(response => {
        if (!response.ok) throw new Error("Products unavailable");
        return response.json();
      })
      .then(result => {
        const products = Array.isArray(result.data)
          ? result.data
          : result.data?.products || [];

        const valid = products.filter(item =>
          item.images?.[0] && Number(item.price) > 0
        );

        // Prefer a product with a genuine discount.
        const discounted = valid
          .filter(item => Number(item.oldPrice) > Number(item.price))
          .sort((a, b) => {
            const aOff = 1 - a.price / a.oldPrice;
            const bOff = 1 - b.price / b.oldPrice;
            return bOff - aOff;
          });

        if (mounted) {
          setProduct(discounted[0] || valid[0] || null);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const hasDiscount =
    product &&
    Number(product.oldPrice) > Number(product.price);

  const discount = hasDiscount
    ? Math.round(
        (1 - Number(product.price) / Number(product.oldPrice)) * 100
      )
    : 0;

  const image = product?.images?.[0];

  const productLink = product?.slug
    ? `/product/${encodeURIComponent(product.slug)}`
    : "/#shop";

  return (
    <section className="maxab-promo-section">
      <div className="maxab-promo-banner">

        <div className="maxab-promo-copy">

          <span className="maxab-promo-eyebrow">
            <Flame size={16} />
            MAXAB EXCLUSIVE OFFER
          </span>

          <h2 className="maxab-promo-discount">
            {hasDiscount
              ? `UP TO ${discount}% OFF`
              : "SPECIAL DEALS"}
          </h2>

          <h3 className="maxab-promo-title">
            {product?.name ||
              "Discover Smart Gadgets & Everyday Essentials"}
          </h3>

          <p className="maxab-promo-description">
            আপনার পছন্দের স্মার্ট গ্যাজেট ও প্রয়োজনীয়
            লাইফস্টাইল প্রোডাক্ট এখন MAXAB-এ।
            পছন্দের প্রোডাক্টটি দেখুন এবং সহজেই অর্ডার করুন।
          </p>

          {product && (
            <div className="maxab-promo-price">
              <strong>
                ৳{Number(product.price).toLocaleString("en-BD")}
              </strong>

              {hasDiscount && (
                <del>
                  ৳{Number(product.oldPrice).toLocaleString("en-BD")}
                </del>
              )}
            </div>
          )}

          <a
            href={productLink}
            className="maxab-promo-button"
          >
            অফারটি দেখুন (Grab Offer)
            <ArrowRight size={19} />
          </a>
        </div>

        <div className="maxab-promo-visual">

          {image ? (
            <div className="maxab-promo-product-image">
              <img
                src={image}
                alt={product?.name || "MAXAB featured product"}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="maxab-promo-placeholder">
              <ShoppingBag size={100} strokeWidth={1.1} />
            </div>
          )}

          <div className="maxab-promo-sticker">
            <BadgePercent size={25} />
            <strong>
              {hasDiscount ? `${discount}% OFF` : "MAXAB"}
            </strong>
            <span>
              {hasDiscount ? "SPECIAL DEAL" : "TOP PICKS"}
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
