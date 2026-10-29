import { useState } from "react";
import { Package } from "lucide-react";

export default function ProductImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`image-placeholder ${className}`}>
        <Package size={40} strokeWidth={1.2} />
        <span>MAXPRODUCT COLLECTION</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
