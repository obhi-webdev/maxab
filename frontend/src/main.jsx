import "./styles/darkGreenTheme.css";
import ProductPageLayout from "./pages/ProductPageLayout";
import LogoSettings from "./admin/LogoSettings";
import MetaTrackingSettings from "./admin/MetaTrackingSettings";
import ProductImagesManager from "./admin/ProductImagesManager";
import BannerManager from "./admin/BannerManager";
import CategoryManager from "./admin/CategoryManager";
import DeliverySettings from "./admin/DeliverySettings";
import TrackOrder from "./pages/TrackOrder";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminApp from "./admin/AdminApp";
import ProductDetails from "./pages/ProductDetails";
import Checkout from "./pages/Checkout";
import { CartProvider } from "./context/CartContext";

const path = window.location.pathname;

const privatePage =
  path.startsWith("/admin") ||
  path === "/checkout";

if (privatePage) {
  let robots = document.querySelector('meta[name="robots"]');

  if (!robots) {
    robots = document.createElement("meta");
    robots.name = "robots";
    document.head.appendChild(robots);
  }

  robots.content = "noindex, nofollow";
}


let page;

if (path === "/admin/logo-settings") {
  page = <LogoSettings/>;
} else if (path === "/admin/meta-tracking") {
  page = <MetaTrackingSettings/>;
} else if (path === "/admin/product-images") {
  page = <ProductImagesManager/>;
} else if (path === "/admin/banners") {
  page = <BannerManager/>;
} else if (path === "/admin/categories") {
  page = <CategoryManager/>;
} else if (path === "/admin/delivery-settings") {
  page = <DeliverySettings/>;
} else if (path.startsWith("/admin")) {
  page = <AdminApp/>;
} else if (path.startsWith("/product/")) {
  page = <CartProvider><ProductPageLayout/></CartProvider>;
} else if (path === "/track-order") {
  page = <TrackOrder/>;
} else if (path === "/checkout") {
  page = <CartProvider><Checkout/></CartProvider>;
} else {
  page = <App/>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{page}</React.StrictMode>
);
