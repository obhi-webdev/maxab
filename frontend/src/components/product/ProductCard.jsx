import { Heart, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "../../context/CartContext";
import ProductImage from "../common/ProductImage";

export default function ProductCard({
  product,
  isWishlisted,
  onWishlist
}) {
  const { addToCart } = useCart();

  const discount = product.oldPrice > product.price
    ? Math.round(
        ((product.oldPrice - product.price) / product.oldPrice) * 100
      )
    : 0;

  return (
    <motion.article
      className="shop-product-card"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
    
      data-maxproduct-clickable="true"
      role="link"
      tabIndex={0}
      onClick={(event) => {
        if (event.target.closest(
          "button, a, input, select, textarea, [role='button']"
        )) return;

        window.location.assign(
          `/product/${encodeURIComponent(product.slug || product._id || product.id)}`
        );
      }}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          window.location.assign(
            `/product/${encodeURIComponent(product.slug || product._id || product.id)}`
          );
        }
      }}
    >
      <div className="shop-product-image">
        <ProductImage
          src={product.image}
          alt={product.name}
        />

        {discount > 0 && (
          <span className="discount-label">
            -{discount}%
          </span>
        )}

        <button
          className={`wishlist-button ${isWishlisted ? "saved" : ""}`}
          onClick={() => onWishlist(product.id)}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
        >
          <Heart
            size={18}
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="shop-product-info">

        <h3>
          <a href={`/product/${product.slug}`}>
            {product.name}
          </a>
        </h3>

        <div className="shop-product-price">
          <strong>৳{product.price.toLocaleString("en-BD")}</strong>
          {product.oldPrice > product.price && (
            <del>৳{product.oldPrice.toLocaleString("en-BD")}</del>
          )}
        </div>

        <button
          className="shop-add-cart"
          onClick={() => addToCart(product)}
        >
          <ShoppingCart size={17}/>
          Add to Cart
        </button>
      </div>
    </motion.article>
  );
}
