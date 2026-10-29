const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api"
).replace(/\/$/, "");

const CONSENT_KEY = "maxproduct-marketing-consent";

let settingsPromise = null;
let loaderPromise = null;
let initializedPixel = "";

export function getMetaConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "yes";
  } catch {
    return false;
  }
}

export function setMetaConsent(allowed) {
  try {
    localStorage.setItem(
      CONSENT_KEY,
      allowed ? "yes" : "no"
    );
  } catch {
    // Private browsing may disable storage.
  }

  window.dispatchEvent(
    new CustomEvent("maxproduct-meta-consent-change", {
      detail: Boolean(allowed)
    })
  );
}

function isStorefront() {
  return !window.location.pathname.startsWith("/admin");
}

function isSecureStorefront() {
  return window.location.protocol === "https:";
}

async function getSettings() {
  if (!settingsPromise) {
    settingsPromise = fetch(`${API}/meta-settings/public`)
      .then(async response => {
        if (!response.ok) return null;

        const result = await response.json();
        const data = result.data || {};

        if (
          !data.enabled ||
          !/^\d{10,25}$/.test(data.pixelId || "")
        ) return null;

        return data;
      })
      .catch(() => null);
  }

  return settingsPromise;
}

async function initializePixel() {
  if (
    !isStorefront() ||
    !isSecureStorefront() ||
    !getMetaConsent()
  ) return null;

  const settings = await getSettings();

  if (!settings || !getMetaConsent()) return null;

  if (!loaderPromise) {
    loaderPromise = new Promise((resolve, reject) => {
      if (typeof window.fbq === "function") {
        resolve();
        return;
      }

      const n = function() {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };

      n.queue = [];
      n.loaded = true;
      n.version = "2.0";
      window.fbq = n;

      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://connect.facebook.net/en_US/fbevents.js";

      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    }).catch(error => {
      loaderPromise = null;
      throw error;
    });
  }

  await loaderPromise;

  if (!getMetaConsent()) return null;

  if (initializedPixel !== settings.pixelId) {
    window.fbq("init", settings.pixelId);
    initializedPixel = settings.pixelId;
  }

  return settings.pixelId;
}

export async function trackMetaEvent(
  name,
  data = {},
  eventId = null
) {
  try {
    const pixelId = await initializePixel();
    if (!pixelId || !getMetaConsent()) return false;

    const options = eventId
      ? { eventID: String(eventId) }
      : {};

    window.fbq(
      "trackSingle",
      pixelId,
      name,
      data,
      options
    );

    return true;
  } catch (error) {
    console.warn("Meta event failed:", error.message);
    return false;
  }
}

export function metaProductData(product, quantity = 1) {
  const id = String(product?._id || product?.id || "");
  const qty = Math.max(1, Number(quantity) || 1);
  const price = Number(product?.price || 0);

  return {
    content_ids: id ? [id] : [],
    content_type: "product",
    contents: id
      ? [{ id, quantity: qty, item_price: price }]
      : [],
    content_name: product?.name || "",
    currency: "BDT",
    value: price * qty
  };
}

export async function trackMetaPurchase(order) {
  if (!order?.orderNumber) return false;

  return trackMetaEvent(
    "Purchase",
    {
      currency: "BDT",
      value: Number(order.total || 0),
      order_id: order.orderNumber
    },
    order.orderNumber
  );
}

function showConsentChoice() {
  if (!isStorefront()) return;

  // Respect a choice already made.
  let saved = null;

  try {
    saved = localStorage.getItem(CONSENT_KEY);
  } catch {
    return;
  }

  if (saved === "yes" || saved === "no") return;

  if (document.getElementById("maxproduct-consent")) return;

  const banner = document.createElement("div");
  banner.id = "maxproduct-consent";
  banner.setAttribute("role", "region");
  banner.setAttribute(
    "aria-label",
    "Optional marketing tracking preference"
  );

  Object.assign(banner.style, {
    position: "fixed",
    bottom: "16px",
    left: "16px",
    right: "16px",
    maxWidth: "420px",
    zIndex: "999999",
    padding: "18px",
    background: "#ffffff",
    color: "#183626",
    border: "1px solid #dce8df",
    borderRadius: "12px",
    boxShadow: "0 12px 40px rgba(0,0,0,.18)",
    fontFamily: "Inter, sans-serif",
    fontSize: "13px"
  });

  banner.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px">
      Marketing Tracking Preference
    </div>
    <p style="margin:0 0 14px;line-height:1.6">
      Allow optional Meta Pixel tracking to measure shopping
      activity and improve relevant advertising?
    </p>
    <div style="display:flex;gap:10px">
      <button type="button" data-choice="accept"
        style="padding:10px 16px;background:#14532d;
        color:white;border:0;border-radius:7px;cursor:pointer">
        Accept
      </button>
      <button type="button" data-choice="decline"
        style="padding:10px 16px;background:#f1f5f9;
        color:#334155;border:0;border-radius:7px;cursor:pointer">
        Decline
      </button>
    </div>
  `;

  banner.addEventListener("click", event => {
    const button = event.target.closest("[data-choice]");

    if (!button) return;

    const allowed = button.dataset.choice === "accept";
    setMetaConsent(allowed);
    banner.remove();

    if (allowed) {
      trackMetaEvent("PageView");
    }
  });

  document.body.appendChild(banner);
}

function initializeStorefrontTracking() {
  if (!isStorefront()) return;

  if (getMetaConsent()) {
    trackMetaEvent("PageView");
  }

  // Consent popup disabled by website administrator.
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeStorefrontTracking,
      { once: true }
    );
  } else {
    initializeStorefrontTracking();
  }
}
