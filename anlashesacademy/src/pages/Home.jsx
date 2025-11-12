import React from "react";
import Slider from "../component/body/Slider.jsx";
import ImageUploader from "../component/ImageUploader";

import "./Home.css";
export default function Home({ loggedIn }) {
  return (
    <div style={{ padding: "2rem" }} className="container">
      <div className="first-container">
        <Slider loggedIn={loggedIn} />
        {loggedIn && <ImageUploader loggedIn={loggedIn} />}
      </div>
      <div style={{ height: "2rem" }} className="second-container">
        123
      </div>
    </div>
  );
}
