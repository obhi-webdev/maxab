import crypto from "node:crypto";
import MetaSettings from "../models/MetaSettings.js";

function decryptToken(value) {
  const key = process.env.META_SETTINGS_ENCRYPTION_KEY;

  if (!/^[0-9a-f]{64}$/i.test(key || "")) {
    throw new Error("Meta encryption key missing");
  }

  const [iv, tag, data] = value.split(".");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final()
  ]).toString("utf8");
}

function hash(value) {
  return crypto.createHash("sha256")
    .update(value)
    .digest("hex");
}

export async function sendMetaPurchase(order, context = {}) {
  const settings = await MetaSettings.findOne({
    key: "meta"
  }).select("+encryptedToken +testEventCode");

  if (
    !settings?.enabled ||
    !settings.pixelId ||
    !settings.encryptedToken ||
    !context.consent
  ) {
    return { sent: false, reason: "disabled_or_no_consent" };
  }

  const token = decryptToken(settings.encryptedToken);

  const phone = String(order.customer.phone)
    .replace(/\D/g, "")
    .replace(/^88(?=01)/, "");

  const userData = {
    ph: [hash("88" + phone)]
  };

  if (context.userAgent) {
    userData.client_user_agent = context.userAgent;
  }

  if (context.ip) {
    userData.client_ip_address = context.ip;
  }

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(order.createdAt.getTime() / 1000),
    event_id: order.orderNumber,
    action_source: "website",
    event_source_url: context.sourceUrl,
    user_data: userData,
    custom_data: {
      currency: "BDT",
      value: order.total,
      order_id: order.orderNumber,
      content_type: "product",
      contents: order.items.map(item => ({
        id: String(item.product),
        quantity: item.quantity,
        item_price: item.price
      }))
    }
  };

  const response = await fetch(
    `https://graph.facebook.com/v25.0/${settings.pixelId}/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        data: [event],
        ...(settings.testMode && settings.testEventCode
          ? { test_event_code: settings.testEventCode }
          : {})
      }),
      signal: AbortSignal.timeout(5000)
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Meta API rejected event (${response.status}): ${
        result.error?.message || "Unknown response"
      }`
    );
  }

  return {
    sent: true,
    eventsReceived: result.events_received ?? null
  };
}
