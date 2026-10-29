import { useEffect, useRef, useState } from "react";
import {
  X,
  Download,
  Printer,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import "./premiumInvoice.css";

const money = value =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const dateText = value => {
  if (!value) return "N/A";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
};

export default function OrderDetailsModal({ order, onClose }) {
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    if (!order) return;

    const onKeyDown = event => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    return () =>
      document.removeEventListener("keydown", onKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const customer = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];

  const totalQuantity = items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const orderNumber = String(order.orderNumber || "N/A");

  const paymentMethod =
    order.paymentMethod === "COD"
      ? "Cash on Delivery"
      : order.paymentMethod || "Cash on Delivery";

  const status = String(order.status || "pending");

  async function downloadPDF() {
    if (!invoiceRef.current || downloading) return;

    setDownloading(true);
    setPdfError("");

    try {
      const module = await import("html2pdf.js");
      const html2pdf = module.default;

      const safeOrderNumber = orderNumber.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

      const options = {
        margin: [8, 8, 8, 8],
        filename: `MAXPRODUCT-Invoice-${safeOrderNumber}.pdf`,
        image: {
          type: "jpeg",
          quality: 0.98
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollY: 0
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: [".mp-invoice-totals", ".mp-invoice-footer"]
        }
      };

      await html2pdf()
        .set(options)
        .from(invoiceRef.current)
        .save();
    } catch (error) {
      console.error("Invoice PDF error:", error);
      setPdfError(
        "Unable to generate PDF. Please try Print Invoice."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="maxab-modal-overlay mp-invoice-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="maxab-order-modal mp-invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Invoice for order ${orderNumber}`}
      >
        <div className="mp-invoice-toolbar">
          <div className="mp-invoice-toolbar-heading">
            <span>ORDER MANAGEMENT</span>
            <h2>Order Invoice</h2>
          </div>

          <button
            type="button"
            className="mp-invoice-close"
            onClick={onClose}
            aria-label="Close invoice"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="mp-invoice-scroll">
          <article className="mp-invoice-sheet" ref={invoiceRef}>
            <div className="mp-invoice-top">
              <div>
                <div className="mp-invoice-brand">
                  MAXPRODUCT
                </div>
                <div className="mp-invoice-tagline">
                  EVERYDAY ESSENTIALS
                </div>
              </div>

              <div className="mp-invoice-title">
                <h1>INVOICE</h1>
                <span>#{orderNumber}</span>
              </div>
            </div>

            <div className="mp-invoice-accent"/>

            <div className="mp-invoice-information">
              <div className="mp-invoice-customer">
                <span className="mp-invoice-label">
                  BILL TO
                </span>

                <h3>{customer.name || "Customer"}</h3>

                <p>{customer.phone || "N/A"}</p>

                <p>
                  {[
                    customer.address,
                    customer.district
                  ].filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>

              <div className="mp-invoice-order-info">
                <div>
                  <span>Invoice Date</span>
                  <strong>{dateText(order.createdAt)}</strong>
                </div>

                <div>
                  <span>Order Number</span>
                  <strong>{orderNumber}</strong>
                </div>

                <div>
                  <span>Payment Method</span>
                  <strong>{paymentMethod}</strong>
                </div>

                <div>
                  <span>Order Status</span>
                  <strong className="mp-invoice-status">
                    {status.toUpperCase()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mp-invoice-table-wrap">
              <table className="mp-invoice-table">
                <thead>
                  <tr>
                    <th>PRODUCT DESCRIPTION</th>
                    <th>QTY</th>
                    <th>UNIT PRICE</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.product || index}-${index}`}>
                      <td>
                        <strong>{item.name || "Product"}</strong>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{money(item.price)}</td>
                      <td>
                        {money(
                          Number(item.price || 0) *
                          Number(item.quantity || 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mp-invoice-summary">
              <div className="mp-invoice-summary-note">
                <div className="mp-invoice-payment-label">
                  <CheckCircle2 size={17}/>
                  CASH ON DELIVERY
                </div>

                <p>
                  Payment is collected upon delivery.
                  This invoice does not confirm payment.
                </p>

                <p>
                  Total Items: <strong>{totalQuantity}</strong>
                </p>
              </div>

              <div className="mp-invoice-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(order.subtotal)}</strong>
                </div>

                <div>
                  <span>Delivery Charge</span>
                  <strong>{money(order.deliveryCharge)}</strong>
                </div>

                <div className="mp-invoice-grand">
                  <span>Grand Total</span>
                  <strong>{money(order.total)}</strong>
                </div>
              </div>
            </div>

            <footer className="mp-invoice-footer">
              <strong>Thank you for shopping with MAXPRODUCT.</strong>
              <p>
                This invoice was generated from your order
                information. Please keep it for reference.
              </p>

              <div className="mp-invoice-footer-bottom">
                <span>MAXPRODUCT</span>
                <span>ORDER #{orderNumber}</span>
              </div>
            </footer>
          </article>
        </div>

        {pdfError && (
          <p className="mp-invoice-error" role="alert">
            {pdfError}
          </p>
        )}

        <div className="mp-invoice-actions">
          <button
            type="button"
            className="mp-invoice-back"
            onClick={onClose}
          >
            <ArrowLeft size={16}/>
            Back
          </button>

          <div className="mp-invoice-action-right">
            <button
              type="button"
              className="mp-invoice-print"
              onClick={() => window.print()}
            >
              <Printer size={17}/>
              Print Invoice
            </button>

            <button
              type="button"
              className="mp-invoice-download"
              onClick={downloadPDF}
              disabled={downloading}
            >
              <Download size={17}/>
              {downloading ? "Generating PDF..." : "Download PDF"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
