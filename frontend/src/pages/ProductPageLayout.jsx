import { useState } from "react";
import Header from "../components/layout/Header";
import ProductDetails from "./ProductDetails";
import "../styles/global.css";

export default function ProductPageLayout() {
  const [search, setSearch] = useState("");

  return (
    <>
      <Header
        search={search}
        onSearch={setSearch}
        wishlistCount={0}
        onWishlistClick={() => {
          window.location.assign("/#shop");
        }}
      />

      <ProductDetails/>
    </>
  );
}
