const API = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "/api"
    : "http://localhost:5001/api")
).replace(/\/$/, "");

function getSessionId() {
  try {
    const key = "maxproduct-visitor-session";
    let id = sessionStorage.getItem(key);

    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }

    return id;
  } catch {
    return null;
  }
}

function getDevice() {
  const agent = navigator.userAgent || "";

  if (/ipad|tablet|android(?!.*mobile)/i.test(agent)) {
    return "tablet";
  }

  if (/mobile|iphone|ipod|android/i.test(agent)) {
    return "mobile";
  }

  return "desktop";
}

async function trackVisit() {
  const path = window.location.pathname;

  if (
    path.startsWith("/admin") ||
    path === "/checkout" ||
    navigator.doNotTrack === "1"
  ) return;

  const sessionId = getSessionId();
  if (!sessionId) return;

  const pageType = path.startsWith("/lp/")
    ? "landing"
    : "website";

  try {
    await fetch(`${API}/visitor-analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        pageType,
        path,
        device: getDevice()
      }),
      keepalive: true
    });
  } catch {
    // Analytics failures must not affect shopping.
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackVisit, {
      once: true
    });
  } else {
    trackVisit();
  }
}
