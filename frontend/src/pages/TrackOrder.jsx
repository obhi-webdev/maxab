import { useState } from "react";
import {
  Search, PackageCheck, Truck,
  CheckCircle2, Clock3, XCircle
} from "lucide-react";
import "../styles/checkout.css";

const API = "http://localhost:5001/api";

const steps = [
  { key: "pending", label: "Order Received", Icon: Clock3 },
  { key: "confirmed", label: "Confirmed", Icon: PackageCheck },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: CheckCircle2 }
];

export default function TrackOrder() {
  const [number, setNumber] = useState(
    new URLSearchParams(window.location.search).get("order") || ""
  );
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function track(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API}/track-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: number,
          phone
        })
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body.message || "Unable to track order"
        );
      }

      setResult(body.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const current = result
    ? steps.findIndex(s => s.key === result.status)
    : -1;

  return (
    <div className="store-subpage">
      <header className="store-subpage-header">
        <a href="/" className="store-page-logo">
          MAXAB<span>.</span>
        </a>
        <a href="/">Back to Store</a>
      </header>

      <div className="tracking-page">
        <div className="tracking-heading">
          <PackageCheck size={36}/>
          <h1>Track Your Order</h1>
          <p>
            Enter your order number and the phone number
            used at checkout.
          </p>
        </div>

        <form className="tracking-form" onSubmit={track}>
          <label>Order Number</label>
          <input
            required
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="MAX-XXXXXXXX"
          />

          <label>Order Phone Number</label>
          <input
            required
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
          />

          <button disabled={loading}>
            <Search size={18}/>
            {loading ? "Checking..." : "Track Order"}
          </button>
        </form>

        {error && (
          <div className="checkout-error">{error}</div>
        )}

        {result && (
          <section className="tracking-result">
            <div className="tracking-order-top">
              <div>
                <span>ORDER NUMBER</span>
                <h2>{result.orderNumber}</h2>
              </div>
              <strong>{result.status.toUpperCase()}</strong>
            </div>

            {result.status === "cancelled" ? (
              <div className="tracking-cancelled">
                <XCircle size={30}/>
                This order has been cancelled.
              </div>
            ) : (
              <div className="tracking-steps">
                {steps.map((step, index) => {
                  const Icon = step.Icon;
                  return (
                    <div
                      key={step.key}
                      className={
                        index <= current
                          ? "tracking-step complete"
                          : "tracking-step"
                      }
                    >
                      <Icon size={22}/>
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="tracking-summary">
              <h3>Order Summary</h3>

              {result.items.map((item, index) => (
                <p key={index}>
                  {item.name} × {item.quantity}
                </p>
              ))}

              <div className="tracking-total">
                <span>Order Total</span>
                <strong>
                  ৳{Number(result.total).toLocaleString("en-BD")}
                </strong>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
