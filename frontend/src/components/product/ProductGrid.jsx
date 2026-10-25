import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";




export default function ProductGrid({
  products = [],
  loading = false,
  error = "",
  category,
  setCategory,
  search,
  wishlist,
  onWishlist
}) {
  const [categoryNames, setCategoryNames] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/categories`)
      .then(r => {
        if (!r.ok) throw new Error("Categories unavailable");
        return r.json();
      })
      .then(r => setCategoryNames((r.data || []).map(c => c.name)))
      .catch(() => setCategoryNames([]));
  }, []);

  const visibleProducts = products.filter(product => {
    const categoryMatch =
      category === "All" || product.category === category;

    const query = search.trim().toLowerCase();

    const searchMatch = (
      product.name + " " +
      product.category + " " +
      (product.description || "")
    ).toLowerCase().includes(query);

    return categoryMatch && searchMatch;
  });

  return (
    <section id="shop" className="popular-section">
      <div className="container-wide">

        <div className="popular-heading">
          <div>
            <span className="heading-eyebrow">
              CURATED PRODUCTS
            </span>
            <h2>Popular Products</h2>
          </div>

          <span className="product-result-count">
            {visibleProducts.length} products
          </span>
        </div>

        <div className="shop-filter-bar">
          {["All", ...new Set([...categoryNames, ...products.map(p => p.category)])].map(item => (
            <button
              key={item}
              className={category === item ? "selected" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="no-products">Loading products...</div>
        ) : error ? (
          <div className="no-products">
            Product service is temporarily unavailable.
          </div>
        ) : visibleProducts.length ? (
          <div className="five-product-grid">
            {visibleProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.includes(product.id)}
                onWishlist={onWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try another category or search term.</p>
            <button onClick={() => setCategory("All")}>
              View All Categories
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
