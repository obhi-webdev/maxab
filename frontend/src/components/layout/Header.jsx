import { useEffect, useState } from "react";
import {
  Search, Heart, ShoppingCart, Menu,
  X, ChevronDown, Phone, ArrowRight
} from "lucide-react";
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
  const [maxabScrolled, setMaxabScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setMaxabScrolled(window.scrollY > 100);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true
    });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);



  const [websiteLogo, setWebsiteLogo] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const API = (
      import.meta.env.VITE_API_URL ||
      "http://localhost:5001/api"
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
      

      <header className={`site-header ${maxabScrolled ? "maxab-header-scrolled" : ""}`}>
        <div className="container header-main">

          <a href="/#home" className="site-logo maxab-dynamic-logo">
            {websiteLogo ? (
              <img
                src={websiteLogo}
                alt="MAXAB"
                className="maxab-header-logo-image"
                loading="eager"
                onError={() => setWebsiteLogo("")}
              />
            ) : (
              <>
                MAXAB<span>.</span>
                <small>EVERYDAY ESSENTIALS</small>
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
                          new CustomEvent("maxab-category", {
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

            <nav className={`main-nav ${mobileOpen ? "nav-open" : ""}`}>
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
    </>
  );
}
