import React from "react";
import Slider from "../component/body/Slider";
export default function Home({ loggedIn }) {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Trang Chủ</h1>
      <Slider loggedIn={loggedIn} />
      <p>Chào mừng đến với website của chúng tôi!</p>
    </div>
  );
}
