import { useEffect } from "react";

function setMeta(key, value, attribute = "name") {
  let element = document.head.querySelector(
    `meta[${attribute}="${key}"]`
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", value);
}

export default function SEO({
  title = "MAXPRODUCT | Smart Gadgets, Fashion & Lifestyle",
  description = "Shop smart gadgets, fashion and lifestyle essentials at MAXPRODUCT.",
  image = "",
  noindex = false
}) {
  useEffect(() => {
    document.title = title;

    const base = "https://maxproduct.shop";
    const path = window.location.pathname;
    const canonicalUrl = base + (
      path === "/" ? "/" : path.replace(/\/$/, "")
    );

    let canonical = document.head.querySelector(
      'link[rel="canonical"]'
    );

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalUrl;

    setMeta("og:url", canonicalUrl, "property");
    setMeta("og:site_name", "MAXPRODUCT", "property");
    setMeta("twitter:card", "summary_large_image");

    setMeta("description", description);
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");

    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta(
      "og:type",
      path.startsWith("/product/") ? "product" : "website",
      "property"
    );

    if (image) {
      setMeta("og:image", image, "property");
    } else {
      document.head.querySelector(
        'meta[property="og:image"]'
      )?.remove();
    }

    return () => {};
  }, [title, description, image, noindex]);

  return null;
}
