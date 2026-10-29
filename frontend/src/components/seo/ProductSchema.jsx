import { useEffect } from "react";

export default function ProductSchema({ product }) {
  useEffect(() => {
    const previous = document.getElementById(
      "maxproduct-product-schema"
    );
    previous?.remove();

    if (!product?.name || product.isActive === false) {
      return;
    }

    const rawPrice = Number(product.price);
    const validPrice =
      Number.isFinite(rawPrice) && rawPrice > 0;

    const slug = String(product.slug || product._id || product.id || "");
    const url = `https://maxproduct.shop/product/${encodeURIComponent(slug)}`;

    const images = (
      Array.isArray(product.images) ? product.images : []
    ).filter(src => {
      if (typeof src !== "string") return false;

      try {
        const url = new URL(src);
        return url.protocol === "https:";
      } catch {
        return false;
      }
    });

    const description = String(product.description || "")
      .replace(/[#*`_~]/g, "")
      .replace(/\\s+/g, " ")
      .trim();

    const data = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      url,
      ...(description ? { description } : {}),
      ...(images.length ? { image: images } : {}),
      ...(product.category ? { category: product.category } : {}),
      ...(validPrice ? {
        offers: {
          "@type": "Offer",
          url,
          price: rawPrice,
          priceCurrency: "BDT",
          availability: Number(product.stock) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock"
        }
      } : {})
    };

    const script = document.createElement("script");
    script.id = "maxproduct-product-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [product]);

  return null;
}
