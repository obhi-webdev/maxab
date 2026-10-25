import { useEffect } from "react";
import {
  X,
  UserRound,
  Phone,
  MapPin,
  Package,
  CreditCard,
  CalendarDays,
  Truck
} from "lucide-react";

const money = amount =>
  `৳${Number(amount || 0).toLocaleString("en-BD")}`;

export default function OrderDetailsModal({ order, onClose }) {
  useEffect(() => {
    if (!order) return;

    const closeOnEscape = event => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () =>
      document.removeEventListener("keydown", closeOnEscape);
  }, [order, onClose]);

  if (!order) return null;

  const customer = order.customer || {};

  return (
    <div
      className="maxab-modal-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="maxab-order-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.orderNumber} details`}
      >
        <header className="maxab-modal-header">
          <div>
            <span>ORDER DETAILS</span>
            <h2>{order.orderNumber}</h2>
          </div>

          <button onClick={onClose} aria-label="Close order details">
            <X size={22}/>
          </button>
        </header>

        <div className="maxab-modal-body">

          <div className="maxab-order-meta">
            <span>
              <CalendarDays size={16}/>
              {new Date(order.createdAt).toLocaleString("en-BD")}
            </span>

            <span className={`maxab-order-status ${order.status}`}>
              {order.status}
            </span>
          </div>

          <div className="maxab-detail-section">
            <h3><UserRound size={19}/> Customer Information</h3>

            <div className="maxab-detail-row">
              <span>Customer Name</span>
              <strong>{customer.name}</strong>
            </div>

            <div className="maxab-detail-row">
              <span>Phone Number</span>
              <a href={`tel:${customer.phone}`}>
                <Phone size={14}/> {customer.phone}
              </a>
            </div>

            <div className="maxab-detail-row">
              <span>District</span>
              <strong>{customer.district}</strong>
            </div>

            <div className="maxab-detail-address">
              <MapPin size={18}/>
              <div>
                <small>Delivery Address</small>
                <p>{customer.address}</p>
              </div>
            </div>
          </div>

          <div className="maxab-detail-section">
            <h3><Package size={19}/> Ordered Products</h3>

            {(order.items || []).map((item, index) => (
              <div className="maxab-order-item" key={index}>
                <div>
                  <strong>{item.name}</strong>
                  <small>Quantity: {item.quantity}</small>
                  <small>Unit Price: {money(item.price)}</small>
                </div>

                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="maxab-detail-section">
            <h3><Truck size={19}/> Delivery & Payment</h3>

            <div className="maxab-detail-row">
              <span>Delivery Area</span>
              <strong>
                {customer.deliveryArea === "inside"
                  ? "Inside City"
                  : "Outside City"}
              </strong>
            </div>

            <div className="maxab-detail-row">
              <span>Payment Method</span>
              <strong><CreditCard size={15}/> Cash on Delivery</strong>
            </div>
          </div>

          <div className="maxab-order-bill">
            <div>
              <span>Subtotal</span>
              <strong>{money(order.subtotal)}</strong>
            </div>

            <div>
              <span>Delivery Charge</span>
              <strong>{money(order.deliveryCharge)}</strong>
            </div>

            <div className="maxab-order-grand">
              <span>Total Bill</span>
              <strong>{money(order.total)}</strong>
            </div>
          </div>
        </div>

        <footer className="maxab-modal-footer">
          <button
            type="button"
            className="maxab-print-invoice"
            onClick={() => window.print()}
          >
            Print Invoice / Save PDF
          </button>
          <button
            type="button"
            className="maxab-close-details"
            onClick={onClose}
          >
            Close Details
          </button>
        </footer>
      </section>
    </div>
  );
}
