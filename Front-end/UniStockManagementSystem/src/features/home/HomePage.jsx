import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div>
      <h1>Home Pageassssssssssssssssssssssssssss</h1>
      <p>
        Welcome to the Home
        Pageasssssssssssssssssssssssssssasssssssssssssssssssssssssss
      </p>
      <Link to="/login" className="btn">
        Loginassssssssssssssssssssssssssssassssssssssssssssssssssssssss
      </Link>
    </div>
  );
};

export default HomePage;
