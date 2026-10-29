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

    setMeta("description", description);
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");

    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");

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
