import { trackMetaPurchase } from "../services/metaPixel";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ShoppingBag, CheckCircle2, LockKeyhole
} from "lucide-react";
import { useCart } from "../context/CartContext";
import "../styles/checkout.css";

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
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryRates, setDeliveryRates] = useState(null);
  const [ratesError, setRatesError] = useState("");


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
        "maxab-checkout-request-id"
      );

      if (!requestId) {
        requestId = crypto.randomUUID();
        sessionStorage.setItem(
          "maxab-checkout-request-id",
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
      sessionStorage.removeItem("maxab-checkout-request-id");
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
          Back to MAXAB
        </a>
      </div>
    );
  }

  return (
    <div className="store-subpage">
      <div className="store-subpage-header">
        <a className="store-page-logo" href="/">MAXAB<span>.</span></a>
        <a href="/#shop"><ArrowLeft size={18}/> Continue Shopping</a>
      </div>

      <div className="checkout-container">
        <div className="checkout-heading">
          <span>SECURE CHECKOUT</span>
          <h1>Complete Your Order</h1>
          <p>Fill in your delivery information to place a COD order.</p>
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
              <h2>Delivery Information</h2>

              <div className="checkout-field">
                <label>Full Name *</label>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={customer.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="checkout-field">
                <label>Mobile Number *</label>
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
                <label>District *</label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={customer.district}
                  onChange={e => update("district", e.target.value)}
                  placeholder="Mymensingh"
                />
              </div>

              <div className="checkout-field">
                <label>Complete Address *</label>
                <textarea
                  required
                  minLength={8}
                  maxLength={500}
                  rows={4}
                  value={customer.address}
                  onChange={e => update("address", e.target.value)}
                  placeholder="House, road, area, landmark..."
                />
              </div>

              <div className="checkout-field">
                <label>Delivery Area *</label>
                <select
                  value={customer.deliveryArea}
                  onChange={e => update("deliveryArea", e.target.value)}
                >
                  <option value="inside">
                    Inside City — ৳{deliveryRates?.inside ?? "..."}
                  </option>
                  <option value="outside">
                    Outside City — ৳{deliveryRates?.outside ?? "..."}
                  </option>
                </select>
              </div>

              <div className="checkout-payment">
                <LockKeyhole size={20}/>
                <div>
                  <strong>Cash on Delivery</strong>
                  <p>Pay when your order is delivered.</p>
                </div>
              </div>
            </section>

            <aside className="checkout-panel checkout-summary">
              <h2>Order Summary</h2>

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
                  onChange={event =>
                    setMarketingConsent(event.target.checked)
                  }
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
                {sending ? "Submitting Order..." : "Confirm COD Order"}
              </button>

              <p className="checkout-disclaimer">
                Your order will remain pending until confirmed by the store.
              </p>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
