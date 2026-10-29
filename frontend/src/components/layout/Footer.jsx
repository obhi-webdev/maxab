import {
  Mail,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  PackageCheck,
  Headphones,
  ShoppingBag,
  LockKeyhole,
  Heart,
  Globe,
  Camera,
  PlayCircle
} from "lucide-react";

import "./premiumFooter.css";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/#shop" },
  { label: "Categories", href: "/#category" },
  { label: "About MAXPRODUCT", href: "/#about" }
];

const customerLinks = [
  { label: "Track Your Order", href: "/track-order" },
  { label: "Explore Products", href: "/#shop" },
  { label: "Shop by Category", href: "/#category" }
];

function FooterLinkGroup({ title, links }) {
  return (
    <div className="mxft-column">
      <h3>{title}</h3>
      <nav aria-label={title}>
        {links.map(item => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="contact" className="mxft-footer">

      <div className="mxft-newsletter-wrap">
        <div className="mxft-newsletter">

          <div className="mxft-newsletter-title">
            <div className="mxft-newsletter-icon">
              <Mail size={26} strokeWidth={1.8} />
            </div>

            <div>
              <span className="mxft-eyebrow">
                THE MAXPRODUCT CLUB
              </span>

              <h2>Stay Updated, Stay Inspired!</h2>

              <p>
                Discover new arrivals, exclusive offers
                and everyday essentials from MAXPRODUCT.
              </p>
            </div>
          </div>

          <div className="mxft-newsletter-right">
            <div className="mxft-newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                aria-label="Email address"
                disabled
              />

              <button type="button" disabled>
                Coming Soon
                <ArrowUpRight size={17} />
              </button>
            </div>

            <small>
              Our email newsletter is launching soon.
            </small>
          </div>

          <div className="mxft-newsletter-decoration">
            <ShoppingBag size={82} strokeWidth={1.2} />
          </div>

        </div>
      </div>

      <div className="mxft-main">
        <div className="mxft-container">

          <div className="mxft-grid">

            <div className="mxft-brand">
              <a href="/" className="mxft-brand-logo">
                MAXPRODUCT<span>.</span>
              </a>

              <p className="mxft-brand-description">
                Discover better everyday essentials.
                From smart gadgets to lifestyle
                favorites, shop smarter with MAXPRODUCT.
              </p>

              <div className="mxft-brand-tagline">
                <Heart size={15} />
                Made for everyday living
              </div>

              <div className="mxft-socials" aria-label="Social media">
                <span title="Facebook">
                  <Globe size={17} />
                </span>
                <span title="Instagram">
                  <Camera size={17} />
                </span>
                <span title="YouTube">
                  <PlayCircle size={17} />
                </span>
              </div>
            </div>

            <FooterLinkGroup
              title="QUICK LINKS"
              links={quickLinks}
            />

            <FooterLinkGroup
              title="CUSTOMER SERVICE"
              links={customerLinks}
            />

            <div className="mxft-column">
              <h3>SHOPPING WITH MAXPRODUCT</h3>

              <div className="mxft-service-item">
                <Truck size={17} />
                <span>Delivery Across Bangladesh</span>
              </div>

              <div className="mxft-service-item">
                <PackageCheck size={17} />
                <span>Cash on Delivery</span>
              </div>

              <div className="mxft-service-item">
                <Headphones size={17} />
                <span>Customer Support</span>
              </div>
            </div>

            <div className="mxft-column mxft-payment">
              <h3>PAYMENT METHODS</h3>

              <div className="mxft-payment-list">
                <div className="mxft-payment-pill">
                  <PackageCheck size={16} />
                  Cash on Delivery
                </div>
              </div>

              <div className="mxft-trust">
                <div>
                  <LockKeyhole size={19} />
                  <span>
                    <strong>SSL</strong>
                    SECURE
                  </span>
                </div>

                <div>
                  <ShieldCheck size={19} />
                  <span>
                    <strong>SAFE</strong>
                    SHOPPING
                  </span>
                </div>
              </div>

              <p className="mxft-payment-note">
                Simple and convenient shopping.
              </p>
            </div>

          </div>

          <div className="mxft-bottom">
            <p>
              © {new Date().getFullYear()} MAXPRODUCT.
              All rights reserved.
            </p>

            <div className="mxft-bottom-right">
              <span>Smart Gadgets</span>
              <span className="mxft-dot" />
              <span>Fashion</span>
              <span className="mxft-dot" />
              <span>Lifestyle</span>
            </div>
          </div>

        </div>
      </div>

    </footer>
  );
}
