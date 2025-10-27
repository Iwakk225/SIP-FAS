import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import Statistik from "./components/Statistik";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/SignUpPage" element={<SignUpPage />} />
        <Route path="/Statistik" element={<Statistik />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
