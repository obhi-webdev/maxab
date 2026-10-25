import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("maxab-cart") || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("maxab-cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(product) {
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
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
      addToCart, changeQuantity, clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
