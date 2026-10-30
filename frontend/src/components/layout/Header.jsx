import { useEffect, useState } from "react";
import { Search, Heart, ShoppingCart, Menu, X, ChevronDown, Phone, ArrowRight, ChevronRight } from "lucide-react";
import { useCart } from "../../context/CartContext";

const menuItems = [
  ["Home", "#home"],
  ["Shop", "#shop"],
  ["About", "#about"],
  
  ["Contact Us", "#contact"]
];

export default function Header({
  search,
  onSearch,
  wishlistCount = 0,
  onWishlistClick
}) {
  const [MAXPRODUCTScrolled, setMAXPRODUCTScrolled] = useState(false);

  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let frame = 0;

    const update = () => {
      frame = 0;

      const distance = Math.max(0, window.scrollY);
      const progress = Math.min(1, distance / 160);

      header.style.setProperty(
        "--maxproduct-nav-progress",
        String(progress)
      );

      setMAXPRODUCTScrolled(previous =>
        previous === (progress >= 1)
          ? previous
          : progress >= 1
      );
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();

    window.addEventListener("scroll", onScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      header.style.removeProperty("--maxproduct-nav-progress");
    };
  }, []);



  const [websiteLogo, setWebsiteLogo] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const API = (
      import.meta.env.VITE_API_URL ||
      (import.meta.env.VITE_API_URL || 'http://localhost:5001/api')
    ).replace(/\/$/, "");

    fetch(`${API}/site-branding/public`, {
      signal: controller.signal
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Unable to load website logo");
        }
        return response.json();
      })
      .then(result => {
        setWebsiteLogo(result.data?.logoUrl || "");
      })
      .catch(error => {
        if (error.name !== "AbortError") {
          console.warn("Website branding:", error.message);
        }
      });

    return () => controller.abort();
  }, []);


  const { count, setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const categories = [
    ["Smart Gadgets", "Smart Gadgets"],
    ["Fashion", "Fashion"],
    ["Personal Care", "Personal Care"]
  ];

  return (
    <>
      

      <header className={`site-header ${MAXPRODUCTScrolled ? "maxab-header-scrolled" : ""}`}>
        <div className="container header-main">

          <a href="/#home" className="site-logo maxab-dynamic-logo">
            {websiteLogo ? (
              <img
                src={websiteLogo}
                alt="MAXPRODUCT"
                className="maxab-header-logo-image"
                loading="eager"
                onError={() => setWebsiteLogo("")}
              />
            ) : (
              <>
                MAXPRODUCT
                <small>EVERYDAYESSENTIALS</small>
              </>
            )}
          </a>

          <form
            className="header-search"
            role="search"
            onSubmit={e => {
              e.preventDefault();
              document.getElementById("shop")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <input
              aria-label="Search products"
              placeholder="Search for products..."
              value={search}
              onChange={e => onSearch(e.target.value)}
            />
            <button type="submit" aria-label="Search">
              <Search size={21}/>
            </button>
          </form>

          <div className="header-tools">

            <button
              className="header-tool"
              onClick={onWishlistClick}
              aria-label="View wishlist"
            >
              <span className="tool-icon">
                <Heart size={25}/>
                {wishlistCount > 0 && (
                  <b className="tool-count">{wishlistCount}</b>
                )}
              </span>
              <span>Wishlist</span>
            </button>

            <a className="header-tool contact-tool" href="#contact">
              <Phone size={24}/>
              <span>Contact</span>
            </a>

            <button
              className="header-tool"
              onClick={() => setCartOpen(true)}
              aria-label="Open shopping cart"
            >
              <span className="tool-icon">
                <ShoppingCart size={27}/>
                <b className="tool-count">{count}</b>
              </span>
              <span>Your Cart</span>
            </button>

            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X/> : <Menu/>}
            </button>

          </div>
        </div>

        <div className="navigation-wrapper">
          <div className="container navigation-inner">

            <div className="category-menu-container">
              <button
                className="category-menu-button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                aria-expanded={categoryOpen}
              >
                <Menu size={19}/>
                <span>CATEGORIES</span>
                <ChevronDown size={17}/>
              </button>

              {categoryOpen && (
                <div className="category-dropdown">
                  {categories.map(([name, key]) => (
                    <a
                      key={key}
                      href={`#shop`}
                      onClick={() => {
                        setCategoryOpen(false);
                        window.dispatchEvent(
                          new CustomEvent("MAXPRODUCT-category", {
                            detail: key
                          })
                        );
                      }}
                    >
                      {name}
                      <ArrowRight size={15}/>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <nav className="main-nav">
              {menuItems.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))}
            </nav>

            <a className="nav-contact" href="#contact">
              Contact
            </a>

          </div>
        </div>
      </header>

      {/* MAXPRODUCT PREMIUM MOBILE DRAWER */}
      {mobileOpen && (
        <div className="mp-mobile-overlay">
          <button
            type="button"
            className="mp-mobile-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />

          <aside
            className="mp-mobile-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <div className="mp-mobile-top">
              <div>
                <strong>MAXPRODUCT</strong>
                <p>Explore our collection</p>
              </div>

              <button
                type="button"
                className="mp-mobile-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={22}/>
              </button>
            </div>

            <div className="mp-mobile-content">
              <div className="mp-mobile-heading">NAVIGATION</div>

              <nav className="mp-mobile-links">
                {menuItems.map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{label}</span>
                    <ArrowRight size={17}/>
                  </a>
                ))}
              </nav>

              <div className="mp-mobile-heading">
                SHOP BY CATEGORY
              </div>

              <div className="mp-mobile-categories">
                {categories.map(([name, key]) => (
                  <a
                    key={key}
                    href="/#shop"
                    onClick={() => {
                      setMobileOpen(false);
                      setCategoryOpen(false);
                      window.dispatchEvent(
                        new CustomEvent("MAXPRODUCT-category", {
                          detail: key
                        })
                      );
                    }}
                  >
                    <span>{name}</span>
                    <ChevronRight size={17}/>
                  </a>
                ))}
              </div>
            </div>

            <div className="mp-mobile-footer">
              <a
                href="/#shop"
                onClick={() => setMobileOpen(false)}
              >
                Explore Products
                <ArrowRight size={18}/>
              </a>
            </div>
          </aside>
        </div>
      )}

    </>
  );
}
