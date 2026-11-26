import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiBox, FiArrowRight, FiZap, FiShield, FiCloud, FiBarChart2, FiCheckCircle } from "react-icons/fi";
import { selectAuth } from "../store/authSlice";

const FEATURES = [
  { icon: FiZap, title: "Live stock tracking", text: "Quantities, values and out-of-stock alerts update the moment you save a change.", accent: "indigo" },
  { icon: FiBarChart2, title: "Instant insights", text: "See total inventory value, category spread and low-stock items at a glance.", accent: "cyan" },
  { icon: FiShield, title: "Secure by default", text: "Verified email sign-up, HTTP-only sessions, rate-limited logins and hashed passwords.", accent: "emerald" },
  { icon: FiCloud, title: "Product photos", text: "Upload images for every item. They're stored in the cloud, optimised and served fast.", accent: "rose" },
];

export default function Landing() {
  const { loggedIn } = useSelector(selectAuth);

  return (
    <div>
      <nav className="nav">
        <div className="container">
          <Link to="/" className="brand">
            <span className="brand-mark"><FiBox size={18} /></span>
            InventoryEasePro
          </Link>
          <div className="row">
            {loggedIn ? (
              <Link className="btn btn-primary" to="/app/dashboard">Open dashboard <FiArrowRight /></Link>
            ) : (
              <>
                <Link className="btn btn-ghost" to="/app/login-user">Log in</Link>
                <Link className="btn btn-primary" to="/app/register-user">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="hero container">
        <div className="blob" style={{ width: 380, height: 380, background: "#6366f1", top: -40, left: -120 }} />
        <div className="blob" style={{ width: 320, height: 320, background: "#22d3ee", top: 120, right: -100, opacity: 0.35 }} />

        <div className="hero-grid">
          <div className="rise">
            <span className="eyebrow">● Inventory, reimagined</span>
            <h1>
              Your stock, <span className="grad-text">beautifully</span> under control.
            </h1>
            <p className="lead">
              InventoryEasePro replaces spreadsheets with a fast, real-time workspace. Track every product, value and
              reorder point in one place, with a dashboard built to be read at a glance.
            </p>
            <div className="hero-ctas">
              {loggedIn ? (
                <Link className="btn btn-primary" to="/app/dashboard">Go to dashboard <FiArrowRight /></Link>
              ) : (
                <>
                  <Link className="btn btn-primary" to="/app/register-user">Create free account <FiArrowRight /></Link>
                  <Link className="btn" to="/app/login-user">I already have an account</Link>
                </>
              )}
            </div>
            <div className="hero-meta">
              <span><FiCheckCircle color="#34d399" /> Email-verified accounts</span>
              <span><FiCheckCircle color="#34d399" /> Cloud image storage</span>
              <span><FiCheckCircle color="#34d399" /> Works on any device</span>
            </div>
          </div>

          <div className="glass preview float rise rise-d2">
            <div className="preview-top"><i /><i /><i /></div>
            <div className="preview-stat-row">
              <div className="preview-stat"><small>Products</small><b>128</b></div>
              <div className="preview-stat"><small>Stock value</small><b>₹4.2L</b></div>
              <div className="preview-stat"><small>Low stock</small><b style={{ color: "#fde68a" }}>7</b></div>
            </div>
            <div className="bars" aria-hidden="true">
              {[55, 80, 42, 95, 70, 88, 60, 110, 76, 92].map((h, i) => (
                <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
            <div className="glass floating-chip" style={{ padding: ".6rem .9rem", borderRadius: 14, boxShadow: "var(--shadow)" }}>
              <span className="badge badge-success">Restocked just now</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features container">
        <div className="section-head rise">
          <span className="eyebrow">Everything you need</span>
          <h2 className="mt-2">Built for speed, clarity and trust</h2>
          <p>A focused toolset that keeps your team confident about what’s on the shelf, without the clutter.</p>
        </div>
        <div className="grid grid-4">
          {FEATURES.map(({ icon: Icon, title, text, accent }, i) => (
            <div key={title} className={`glass glass-hover feature rise rise-d${Math.min(i + 1, 4)}`}>
              <div className={`accent-${accent}`}>
                <div className="stat-icon"><Icon size={22} /></div>
              </div>
              <h3>{title}</h3>
              <p style={{ margin: 0, fontSize: ".95rem" }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <span>© {new Date().getFullYear()} InventoryEasePro. All rights reserved.</span>
          <span>
            <Link to="/app/contact-us" style={{ color: "#a5b4fc" }}>Contact us</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
