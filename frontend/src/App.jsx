import PromoOffer from "./components/home/PromoOffer";
import SEO from "./components/seo/SEO";
import HomeBanner from "./components/home/HomeBanner";
import { useEffect, useState } from "react";

import Header from "./components/layout/Header";
import CategoryBanners from "./components/home/CategoryBanners";
import ProductGrid from "./components/product/ProductGrid";
import CartDrawer from "./components/cart/CartDrawer";
import Footer from "./components/layout/Footer";
import CustomCursor from "./components/common/CustomCursor";

import { CartProvider } from "./context/CartContext";
import { ShieldCheck, Truck, ShoppingBag } from "lucide-react";


import "./styles/global.css";

function Storefront() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [liveProducts, setLiveProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/products`
        );

        if (!response.ok) {
          throw new Error("Product service unavailable");
        }

        const result = await response.json();

        if (active) {
          setLiveProducts(
            (result.data || []).map(product => ({
              ...product,
              id: product._id,
              image: product.images?.[0] || "",
              badge: product.featured ? "Featured" : ""
            }))
          );
        }
      } catch (error) {
        if (active) setProductsError(error.message);
      } finally {
        if (active) setProductsLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);


  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("maxab-wishlist") || "[]"
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [wishlistOnly, setWishlistOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem("maxab-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const selectCategory = event => {
      setCategory(event.detail);
      setWishlistOnly(false);
    };

    window.addEventListener("maxab-category", selectCategory);

    return () =>
      window.removeEventListener("maxab-category", selectCategory);
  }, []);

  function toggleWishlist(id) {
    setWishlist(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    );
  }

  function selectCategory(value) {
    setCategory(value);
    setWishlistOnly(false);
  }

  function openWishlist() {
    setWishlistOnly(current => !current);
    setCategory("All");

    setTimeout(() => {
      document.getElementById("shop")?.scrollIntoView({
        behavior: "smooth"
      });
    }, 0);
  }

  return (
    <>
      <SEO
        title="MAXAB | Smart Gadgets, Fashion & Lifestyle"
        description="Explore smart gadgets, fashion, personal care and everyday essentials at MAXAB."
      />
      <CustomCursor/>

      <Header
        search={search}
        onSearch={setSearch}
        wishlistCount={wishlist.length}
        onWishlistClick={openWishlist}
      />

      <main id="home">
        <HomeBanner/>
        <CategoryBanners onSelect={selectCategory}/>

        {wishlistOnly ? (
          <section id="shop" className="popular-section">
            <div className="container-wide">
              <div className="popular-heading">
                <div>
                  <span className="heading-eyebrow">
                    YOUR SAVED ITEMS
                  </span>
                  <h2>My Wishlist</h2>
                </div>
                <button
                  className="wishlist-back"
                  onClick={() => setWishlistOnly(false)}
                >
                  View All Products
                </button>
              </div>

              <div className="five-product-grid">
                {liveProducts
                  .filter(p => wishlist.includes(p.id))
                  .map(p => (
                    <WishlistProduct
                      key={p.id}
                      product={p}
                      wishlist={wishlist}
                      onWishlist={toggleWishlist}
                    />
                  ))}
              </div>

              {wishlist.length === 0 && (
                <div className="no-products">
                  Your wishlist is empty.
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
<ProductGrid
            products={liveProducts}
            loading={productsLoading}
            error={productsError}
            category={category}
            setCategory={setCategory}
            search={search}
            wishlist={wishlist}
            onWishlist={toggleWishlist}
          />
            <PromoOffer />
          </>
        )}

        <section className="store-benefits">
          <div className="container-wide benefits-grid">
            <div>
              <ShoppingBag/>
              <span>Easy Online Shopping</span>
            </div>
            <div>
              <Truck/>
              <span>Delivery Options</span>
            </div>
            <div>
              <ShieldCheck/>
              <span>Customer Support</span>
            </div>
          </div>
        </section>

        <section id="about" className="about-mini">
          <div className="container-wide">
            <span className="heading-eyebrow">ABOUT OUR STORE</span>
            <h2>Welcome to MAXAB</h2>
            <p>
              Discover smart gadgets, fashion and lifestyle
              essentials from one convenient online store.
              MAXAB is designed to make product discovery
              and shopping simple.
            </p>
          </div>
        </section>
      </main>

      <Footer/>
      <CartDrawer/>
    </>
  );
}

import ProductCard from "./components/product/ProductCard";

function WishlistProduct(props) {
  return (
    <ProductCard
      {...props}
      isWishlisted={props.wishlist.includes(props.product.id)}
    />
  );
}

export default function App() {
  return (
    <CartProvider>
      <Storefront/>
    </CartProvider>
  );
}
