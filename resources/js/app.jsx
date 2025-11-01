import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import Statistik from "./components/Statistik";
import LaporPage from "./components/LaporPage";
import ProfilePage from "./components/ProfilePage";
import ForgotPasswordPage from "./components/ForgotPassword";
import ResetPasswordPage from "./components/ResetPasswordPage";
import VerifyCodePage from "./components/VerifyCodePage";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/SignUpPage" element={<SignUpPage />} />
        <Route path="/Statistik" element={<Statistik />} />
        <Route path="/LaporPage" element={<LaporPage />} />
        <Route path="/ProfilePage" element={<ProfilePage />} />
        <Route path="/ForgotPassword" element={<ForgotPasswordPage />} />
        <Route path="/ResetPasswordPage" element={<ResetPasswordPage />} />
        <Route path="/VerifyCodePage" element={<VerifyCodePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
