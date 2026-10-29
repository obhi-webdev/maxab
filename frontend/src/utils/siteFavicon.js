const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

export function applySiteFavicon(url) {
  const existing = document.querySelector(
    'link[data-maxproduct-favicon="true"]'
  );

  if (!url) {
    existing?.remove();
    return;
  }

  let link = existing;

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-maxproduct-favicon", "true");
    document.head.appendChild(link);
  }

  link.href = url;
}

export async function loadSiteFavicon() {
  try {
    const response = await fetch(`${API}/site-branding/public`, {
      cache: "no-store"
    });

    if (!response.ok) return;

    const result = await response.json();

    applySiteFavicon(result.data?.faviconUrl || "");
  } catch (error) {
    console.warn("Favicon unavailable:", error.message);
  }
}

loadSiteFavicon();
