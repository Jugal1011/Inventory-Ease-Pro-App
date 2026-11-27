import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiGrid,
  FiPlusSquare,
  FiUser,
  FiEdit3,
  FiMessageSquare,
  FiLogOut,
  FiMenu,
  FiX,
  FiBox,
  FiUsers,
  FiTruck,
  FiShoppingCart,
  FiShoppingBag,
} from "react-icons/fi";
import { logoutUser, selectAuth } from "../store/authSlice";
import { initials } from "../utils";
import { FullScreenLoader } from "./ui";
import { errorMessage } from "../api";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: FiGrid },
  { to: "/app/products", label: "Products", icon: FiBox },
  { to: "/app/customers", label: "Customers", icon: FiUsers },
  { to: "/app/dealers", label: "Dealers", icon: FiTruck },
  { to: "/app/sales-orders", label: "Sales Orders", icon: FiShoppingCart },
  { to: "/app/purchase-orders", label: "Purchase Orders", icon: FiShoppingBag },
];
const ACCOUNT = [
  { to: "/app/account/profile", label: "Profile", icon: FiUser },
  { to: "/app/account/edit-profile", label: "Edit profile", icon: FiEdit3 },
  { to: "/app/contact-us", label: "Report a bug", icon: FiMessageSquare },
];

export function ProtectedRoute({ children }) {
  const { checked, loggedIn } = useSelector(selectAuth);
  const location = useLocation();

  if (!checked) return <FullScreenLoader />;
  if (!loggedIn) {
    return <Navigate to="/app/login-user" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(selectAuth);
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => setOpen(false), [location.pathname]);

  const logout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Logged out");
    } catch (err) {
      toast.error(errorMessage(err));
    }
    navigate("/app/login-user", { replace: true });
  };

  const renderLink = ({ to, label, icon: Icon }) => (
    <li key={to}>
      <NavLink to={to} className="nav-link">
        <Icon size={18} />
        <span>{label}</span>
      </NavLink>
    </li>
  );

  return (
    <div className="app">
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
        <div className="spread">
          <NavLink to="/" className="brand">
            <span className="brand-mark"><FiBox size={18} /></span>
            InventoryEasePro
          </NavLink>
          <button className="icon-btn menu-toggle" style={{ display: open ? "inline-grid" : undefined }} onClick={() => setOpen(false)} aria-label="Close menu">
            <FiX size={18} />
          </button>
        </div>

        <nav>
          <div className="nav-section">Workspace</div>
          <ul className="nav-list">{NAV.map(renderLink)}</ul>
          <div className="nav-section" style={{ marginTop: "1.4rem" }}>Account</div>
          <ul className="nav-list">{ACCOUNT.map(renderLink)}</ul>
        </nav>

        <div className="sidebar-foot stack" style={{ gap: ".8rem" }}>
          <div className="user-card">
            {user?.photo ? (
              <img className="avatar" src={user.photo} alt="" />
            ) : (
              <div className="avatar">{initials(user?.name)}</div>
            )}
            <div className="who">
              <b>{user?.name || "Account"}</b>
              <small>{user?.email}</small>
            </div>
          </div>
          <button className="btn btn-ghost btn-block" onClick={logout}>
            <FiLogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <div className={`scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />

      <main className="main">
        <div className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
            <FiMenu size={18} />
          </button>
          <div className="greeting" style={{ marginLeft: "auto" }}>
            <span className="muted" style={{ fontSize: ".9rem" }}>
              Signed in as <b style={{ color: "var(--text)" }}>{user?.name?.split(" ")[0] || "you"}</b>
            </span>
          </div>
        </div>
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
