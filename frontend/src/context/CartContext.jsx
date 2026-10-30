import { trackMetaEvent, metaProductData } from "../services/metaPixel";
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("MAXPRODUCT-cart") || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("MAXPRODUCT-cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(product) {
    const quantity = Math.max(1, Number(product.quantity) || 1);

    trackMetaEvent(
      "AddToCart",
      metaProductData(product, quantity)
    );

    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { ...product, quantity }];
    });
    setCartOpen(true);
  }

  // Direct checkout: persist cart before navigating.
  // Unlike addToCart, this never opens the cart drawer.
  function buyNow(product) {
    const quantity = Math.max(1, Number(product.quantity) || 1);

    const existing = cart.find(item => item.id === product.id);

    const nextCart = existing
      ? cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      : [...cart, { ...product, quantity }];

    // Synchronous persistence prevents losing the item on page navigation.
    localStorage.setItem("MAXPRODUCT-cart", JSON.stringify(nextCart));

    setCart(nextCart);
    setCartOpen(false);

    trackMetaEvent(
      "AddToCart",
      metaProductData(product, quantity)
    );
  }

  function changeQuantity(id, delta) {
    setCart(current => current
      .map(item => item.id === id
        ? { ...item, quantity: item.quantity + delta }
        : item
      )
      .filter(item => item.quantity > 0)
    );
  }

  function clearCart() { setCart([]); }

  const count = cart.reduce((sum, p) => sum + p.quantity, 0);
  const total = cart.reduce((sum, p) => sum + p.price * p.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, count, total, cartOpen, setCartOpen,
      addToCart, buyNow, changeQuantity, clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
