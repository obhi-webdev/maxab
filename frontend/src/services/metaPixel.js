let pixelPromise = null;

export async function trackMetaPurchase(order) {
  if (
    window.location.protocol !== "https:" ||
    !order?.orderNumber
  ) return;

  const response = await fetch(
    "http://localhost:5001/api/meta-settings/public"
  );

  if (!response.ok) return;

  const result = await response.json();
  const { enabled, pixelId } = result.data || {};

  if (!enabled || !/^\d{10,25}$/.test(pixelId || "")) return;

  if (!pixelPromise) {
    pixelPromise = new Promise((resolve, reject) => {
      if (typeof window.fbq !== "function") {
        /* Meta Pixel standard loader */
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
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        resolve();
      }
    }).catch(error => {
      pixelPromise = null;
      throw error;
    });
  }

  await pixelPromise;

  window.fbq("init", pixelId);

  window.fbq(
    "trackSingle",
    pixelId,
    "Purchase",
    {
      currency: "BDT",
      value: Number(order.total),
      order_id: order.orderNumber
    },
    {
      eventID: order.orderNumber
    }
  );
}
