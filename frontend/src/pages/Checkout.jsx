import {
  trackMetaPurchase,
  trackMetaEvent,
  getMetaConsent,
  setMetaConsent
} from "../services/metaPixel";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ShoppingBag, CheckCircle2, LockKeyhole
} from "lucide-react";
import { useCart } from "../context/CartContext";
import "../styles/checkout.css";
import "../styles/checkoutReference.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

const INITIAL = {
  name: "",
  phone: "",
  district: "",
  address: "",
  deliveryArea: "inside"
};

const DELIVERY = { inside: 70, outside: 130 };

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [customer, setCustomer] = useState(INITIAL);
  const [sending, setSending] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(getMetaConsent);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryRates, setDeliveryRates] = useState(null);
  const [ratesError, setRatesError] = useState("");

  const checkoutTracked = useRef(false);

  useEffect(() => {
    if (
      !marketingConsent ||
      !cart.length ||
      checkoutTracked.current
    ) return;

    checkoutTracked.current = true;

    trackMetaEvent("InitiateCheckout", {
      currency: "BDT",
      value: cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * item.quantity,
        0
      ),
      content_ids: cart.map(item =>
        String(item.id || item._id)
      ),
      content_type: "product",
      contents: cart.map(item => ({
        id: String(item.id || item._id),
        quantity: item.quantity,
        item_price: Number(item.price || 0)
      })),
      num_items: cart.reduce(
        (sum, item) => sum + item.quantity, 0
      )
    });
  }, [marketingConsent, cart]);




  useEffect(() => {
    fetch(`${API}/products`)
      .then(response => {
        if (!response.ok) throw new Error("Product service unavailable");
        return response.json();
      })
      .then(result => setCatalog(result.data || []))
      .catch(() => setError("Unable to load current product information"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API}/settings/delivery`)
      .then(response => {
        if (!response.ok) throw new Error("Delivery settings unavailable");
        return response.json();
      })
      .then(result => setDeliveryRates(result.data))
      .catch(error => setRatesError(error.message));
  }, []);

  const lines = cart.map(item => {
    const live = catalog.find(p => p._id === item.id);
    return { ...item, live };
  });

  const invalid = lines.some(item =>
    !item.live ||
    item.live.stock < item.quantity ||
    item.quantity > 20
  );

  const subtotal = lines.reduce(
    (sum, item) =>
      sum + (item.live?.price ?? item.price) * item.quantity,
    0
  );

  const delivery = deliveryRates?.[customer.deliveryArea] ?? 0;
  const total = subtotal + delivery;

  function update(key, value) {
    setCustomer(current => ({ ...current, [key]: value }));
  }

  async function placeOrder(e) {
    e.preventDefault();
    if (sending || !cart.length || invalid || !deliveryRates) return;

    setSending(true);
    setError("");

    try {
      let requestId = sessionStorage.getItem(
        "MAXPRODUCT-checkout-request-id"
      );

      if (!requestId) {
        requestId = crypto.randomUUID();
        sessionStorage.setItem(
          "MAXPRODUCT-checkout-request-id",
          requestId
        );
      }

      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId: requestId,
          marketingConsent,
          customer,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Order submission failed");
      }

      setSuccess(result.data);

      if (marketingConsent && !result.duplicate) {
        trackMetaPurchase(result.data).catch(error => {
          console.warn("Browser Meta Purchase failed:", error.message);
        });
      }
      sessionStorage.removeItem("MAXPRODUCT-checkout-request-id");
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div className="checkout-success">
        <CheckCircle2 size={64}/>
        <h1>Order Received!</h1>
        <p>Your Cash on Delivery order has been submitted.</p>
        <div className="checkout-confirmation">
          <span>Order Number</span>
          <strong>{success.orderNumber}</strong>
          <span>Order Total</span>
          <strong>৳{success.total.toLocaleString("en-BD")}</strong>
          <span>Status</span>
          <strong>Pending confirmation</strong>
        </div>
        <a
          className="checkout-submit"
          href={`/track-order?order=${encodeURIComponent(success.orderNumber)}`}
        >
          Track Your Order
        </a>
        <a className="tracking-store-back" href="/">
          Back to MAXPRODUCT
        </a>
      </div>
    );
  }

  return (
    <div className="store-subpage mp-checkout-v3">
      <div className="store-subpage-header">
        <a className="store-page-logo" href="/">MAXPRODUCT<span>.</span></a>
        <a href="/#shop"><ArrowLeft size={18}/> Continue Shopping</a>
      </div>

      <div className="checkout-container">
        <div className="checkout-heading">
          <span>SECURE CHECKOUT</span>
          <h1>আপনার অর্ডার সম্পন্ন করুন</h1>
          <p>সঠিক তথ্য দিয়ে আপনার ক্যাশ অন ডেলিভারি অর্ডারটি নিশ্চিত করুন।</p>
        </div>

        {error && <div className="checkout-error">{error}</div>}
        {ratesError && (
          <div className="checkout-error">
            Delivery charge could not be loaded. Please refresh.
          </div>
        )}

        {!cart.length ? (
          <div className="checkout-empty">
            <ShoppingBag size={45}/>
            <h2>Your cart is empty</h2>
            <a href="/#shop">Browse Products</a>
          </div>
        ) : (
          <form className="checkout-grid" onSubmit={placeOrder}>
            <section className="checkout-panel">
              <h2>Customer Information</h2>

              <div className="checkout-field">
                <label>আপনার নাম <em>*</em></label>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={customer.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                />
              </div>

              <div className="checkout-field">
                <label>আপনার মোবাইল নাম্বার <em>*</em></label>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  pattern="(?:\+?88)?01[3-9][0-9]{8}"
                  value={customer.phone}
                  onChange={e => update("phone", e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div className="checkout-field">
                <label>আপনার জেলা <em>*</em></label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={customer.district}
                  onChange={e => update("district", e.target.value)}
                  placeholder="আপনার জেলার নাম লিখুন"
                />
              </div>

              <div className="checkout-field">
                <label>আপনার সম্পূর্ণ ঠিকানা <em>*</em></label>
                <textarea
                  required
                  minLength={8}
                  maxLength={500}
                  rows={4}
                  value={customer.address}
                  onChange={e => update("address", e.target.value)}
                  placeholder="বাসা, রোড, এলাকা, থানা ও পরিচিত স্থান লিখুন"
                />
              </div>

              <fieldset className="mp-delivery-fieldset">
                <legend>ডেলিভারি লোকেশন নির্বাচন করুন <em>*</em></legend>

                <label className={`mp-delivery-choice ${
                  customer.deliveryArea === "inside" ? "is-selected" : ""
                }`}>
                  <input
                    type="radio"
                    name="deliveryArea"
                    value="inside"
                    checked={customer.deliveryArea === "inside"}
                    onChange={e => update("deliveryArea", e.target.value)}
                  />
                  <span className="mp-delivery-label">
                    ঢাকা সিটির মধ্যে
                  </span>
                  <strong>
                    {deliveryRates
                      ? `৳${deliveryRates.inside}`
                      : "লোড হচ্ছে..."}
                  </strong>
                </label>

                <label className={`mp-delivery-choice ${
                  customer.deliveryArea === "outside" ? "is-selected" : ""
                }`}>
                  <input
                    type="radio"
                    name="deliveryArea"
                    value="outside"
                    checked={customer.deliveryArea === "outside"}
                    onChange={e => update("deliveryArea", e.target.value)}
                  />
                  <span className="mp-delivery-label">
                    ঢাকা সিটির বাইরে
                  </span>
                  <strong>
                    {deliveryRates
                      ? `৳${deliveryRates.outside}`
                      : "লোড হচ্ছে..."}
                  </strong>
                </label>
              </fieldset>

              <div className="checkout-payment">
                <LockKeyhole size={20}/>
                <div>
                  <strong>ক্যাশ অন ডেলিভারি</strong>
                  <p>প্রোডাক্ট হাতে পাওয়ার পর মূল্য পরিশোধ করুন।</p>
                </div>
              </div>
            </section>

            <aside className="checkout-panel checkout-summary">
              <h2>আপনার অর্ডারের বিবরণ</h2>

              {lines.map(item => (
                <div className="checkout-line" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>Quantity: {item.quantity}</small>
                  </div>
                  <b>
                    ৳{(
                      (item.live?.price ?? item.price) *
                      item.quantity
                    ).toLocaleString("en-BD")}
                  </b>
                </div>
              ))}

              <div className="checkout-totals">
                <div><span>Subtotal</span><strong>৳{subtotal.toLocaleString("en-BD")}</strong></div>
                <div><span>Delivery</span><strong>৳{delivery}</strong></div>
                <div className="checkout-grand">
                  <span>Total</span>
                  <strong>৳{total.toLocaleString("en-BD")}</strong>
                </div>
              </div>

              {invalid && !loading && (
                <p className="checkout-error">
                  One or more products are unavailable or exceed stock.
                  Please review your cart.
                </p>
              )}

              <label className="maxab-marketing-consent">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={event => {
                    const allowed = event.target.checked;
                    setMarketingConsent(allowed);
                    setMetaConsent(allowed);
                  }}
                />
                <span>
                  I agree to optional Meta marketing conversion tracking
                  for this order.
                </span>
              </label>

              <button
                type="submit"
                className="checkout-submit"
                disabled={sending || loading || invalid || !deliveryRates}
              >
                {sending ? "অর্ডার সাবমিট হচ্ছে..." : "অর্ডার কনফার্ম করুন"}
              </button>

              <p className="checkout-disclaimer">
                অর্ডারটি যাচাইয়ের পর আমাদের টিম থেকে নিশ্চিত করা হবে।
              </p>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
