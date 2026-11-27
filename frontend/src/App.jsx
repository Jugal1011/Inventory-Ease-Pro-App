import { useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Toaster } from "react-hot-toast";
import { checkAuth } from "./store/authSlice";
import AppLayout, { ProtectedRoute } from "./components/Layout";
import Landing from "./pages/Landing";
import { LoginPage, RegisterPage, ForgotPage, ResetPage, ConfirmEmailPage } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import Customers from "./pages/Customers";
import CustomerForm from "./pages/CustomerForm";
import CustomerDetail from "./pages/CustomerDetail";
import Dealers from "./pages/Dealers";
import DealerForm from "./pages/DealerForm";
import DealerDetail from "./pages/DealerDetail";
import SalesOrders from "./pages/SalesOrders";
import SalesOrderForm from "./pages/SalesOrderForm";
import SalesOrderDetail from "./pages/SalesOrderDetail";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderForm from "./pages/PurchaseOrderForm";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
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
          <Route path="/app/products" element={<Products />} />
          <Route path="/app/add-product" element={<ProductForm mode="create" />} />
          <Route path="/app/edit-product/:id" element={<ProductForm mode="edit" />} />
          <Route path="/app/product-detail/:id" element={<ProductDetail />} />
          <Route path="/app/customers" element={<Customers />} />
          <Route path="/app/add-customer" element={<CustomerForm mode="create" />} />
          <Route path="/app/edit-customer/:id" element={<CustomerForm mode="edit" />} />
          <Route path="/app/customer-detail/:id" element={<CustomerDetail />} />

          <Route path="/app/dealers" element={<Dealers />} />
          <Route path="/app/add-dealer" element={<DealerForm mode="create" />} />
          <Route path="/app/edit-dealer/:id" element={<DealerForm mode="edit" />} />
          <Route path="/app/dealer-detail/:id" element={<DealerDetail />} />

          <Route path="/app/sales-orders" element={<SalesOrders />} />
          <Route path="/app/add-sales-order" element={<SalesOrderForm />} />
          <Route path="/app/sales-order-detail/:id" element={<SalesOrderDetail />} />

          <Route path="/app/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/app/add-purchase-order" element={<PurchaseOrderForm />} />
          <Route path="/app/purchase-order-detail/:id" element={<PurchaseOrderDetail />} />
          <Route path="/app/account/profile" element={<ProfilePage />} />
          <Route path="/app/account/edit-profile" element={<EditProfilePage />} />
          <Route path="/app/contact-us" element={<Contact />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
