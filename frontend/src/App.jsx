import { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Toaster } from "react-hot-toast";
import { checkAuth } from "./store/authSlice";
import AppLayout, { ProtectedRoute } from "./components/Layout";
import Landing from "./pages/Landing";
import { LoginPage, RegisterPage, ForgotPage, ResetPage, ConfirmEmailPage } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import { ProfilePage, EditProfilePage } from "./pages/Profile";
import Contact from "./pages/Contact";
import { FiAlertTriangle } from "react-icons/fi";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="auth-shell">
      <div className="glass auth-card rise" style={{ textAlign: "center" }}>
        <FiAlertTriangle size={40} color="#fbbf24" />
        <h2 className="mt-2">Page not found</h2>
        <p>The page you're looking for doesn't exist or has moved.</p>
        <Link className="btn btn-primary" to="/">Back to home</Link>
      </div>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{ className: "toast-custom", duration: 3500 }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/app/login-user" element={<LoginPage />} />
        <Route path="/app/register-user" element={<RegisterPage />} />
        <Route path="/app/forget-password" element={<ForgotPage />} />
        <Route path="/app/reset-password/:resetToken" element={<ResetPage />} />
        <Route path="/app/confirm-email/:confirmEmailToken" element={<ConfirmEmailPage />} />

        {/* Everything under /app requires a logged-in session */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/add-product" element={<ProductForm mode="create" />} />
          <Route path="/app/edit-product/:id" element={<ProductForm mode="edit" />} />
          <Route path="/app/product-detail/:id" element={<ProductDetail />} />
          <Route path="/app/account/profile" element={<ProfilePage />} />
          <Route path="/app/account/edit-profile" element={<EditProfilePage />} />
          <Route path="/app/contact-us" element={<Contact />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
