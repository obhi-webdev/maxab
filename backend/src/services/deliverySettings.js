import StoreSettings from "../models/StoreSettings.js";

export async function getDeliverySettings() {
  const settings = await StoreSettings.findOne({
    key: "delivery"
  }).lean();

  return {
    inside: settings?.inside ?? 70,
    outside: settings?.outside ?? 130
  };
}
