import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "../../context/CartContext";
import ProductImage from "../common/ProductImage";

export default function CartDrawer() {
  const {
    cart, total, cartOpen, setCartOpen, changeQuantity
  } = useCart();

  if (!cartOpen) return null;

  return (
    <div className="drawer-overlay" onMouseDown={() => setCartOpen(false)}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Your shopping cart"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h2>Your Cart</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart">
            <X />
          </button>
        </div>

        <div className="drawer-content">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={45} />
              <p>Your cart is empty.</p>
              <button className="button-primary" onClick={() => setCartOpen(false)}>
                Continue Shopping
              </button>
            </div>
          ) : cart.map(item => (
            <div className="cart-item" key={item.id}>
              <ProductImage src={item.image} alt={item.name} />
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <strong>৳{item.price.toLocaleString("en-BD")}</strong>
                <div className="quantity">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => changeQuantity(item.id, -1)}
                  ><Minus size={15}/></button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => changeQuantity(item.id, 1)}
                  ><Plus size={15}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>৳{total.toLocaleString("en-BD")}</strong>
            </div>
            <p>Delivery charges are calculated at checkout.</p>
            <a
              className="button-primary"
              href="/checkout"
              onClick={() => setCartOpen(false)}
            >
              Proceed to Checkout
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
