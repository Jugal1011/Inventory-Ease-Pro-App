import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiBox, FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle, FiXCircle, FiKey, FiLogIn, FiUserPlus } from "react-icons/fi";
import { loginUser } from "../store/authSlice";
import { UsersAPI, errorMessage } from "../api";
import { isValidEmail, isStrongPassword, PASSWORD_RULE } from "../utils";
import { Spinner } from "../components/ui";

function AuthShell({ icon, title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="blob" style={{ width: 360, height: 360, background: "#6366f1", top: "5%", left: "10%" }} />
      <div className="blob" style={{ width: 300, height: 300, background: "#22d3ee", bottom: "5%", right: "8%", opacity: 0.3 }} />
      <div className="glass auth-card rise">
        <div className="auth-head">
          <div className="stat-icon">{icon}</div>
          <h2 style={{ marginBottom: ".3rem" }}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
      <Link to="/" className="btn btn-ghost btn-sm" style={{ position: "fixed", top: 18, left: 18 }}>
        <FiArrowLeft size={15} /> Home
      </Link>
    </div>
  );
}

function PasswordInput({ id, name, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-with-icon input-wrap">
      <FiLock size={16} />
      <input
        id={id}
        className="input"
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button type="button" className="input-suffix" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
        {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  );
}

function strengthScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z\d\s]/.test(pw)) score++;
  return score;
}

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(form.email)) return toast.error("Please enter a valid email");
    setBusy(true);
    try {
      await dispatch(loginUser(form)).unwrap();
      toast.success("Welcome back!");
      navigate(location.state?.from || "/app/dashboard", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      icon={<FiLogIn size={24} />}
      title="Welcome back"
      subtitle="Log in to manage your inventory."
      footer={
        <>
          <span>New here?</span>
          <Link to="/app/register-user">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-with-icon">
            <FiMail size={16} />
            <input id="email" className="input" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@company.com" autoComplete="email" required />
          </div>
        </div>
        <div className="field">
          <div className="spread" style={{ flexWrap: "nowrap" }}>
            <label htmlFor="password">Password</label>
            <Link to="/app/forget-password" style={{ fontSize: ".82rem", color: "#a5b4fc" }}>Forgot password?</Link>
          </div>
          <PasswordInput id="password" name="password" value={form.password} onChange={onChange} placeholder="••••••••" autoComplete="current-password" />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const score = strengthScore(form.password);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter your name");
    if (!isValidEmail(form.email)) return toast.error("Please enter a valid email");
    if (!isStrongPassword(form.password)) return toast.error(PASSWORD_RULE);
    if (form.password !== form.confirm) return toast.error("Passwords do not match");

    setBusy(true);
    try {
      await UsersAPI.register({ name: form.name.trim(), email: form.email, password: form.password });
      toast.success("Account created. Check your inbox to verify your email.", { duration: 5000 });
      navigate("/app/login-user");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      icon={<FiUserPlus size={24} />}
      title="Create your account"
      subtitle="Start tracking your inventory in minutes."
      footer={
        <>
          <span>Already registered?</span>
          <Link to="/app/login-user">Log in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <div className="input-with-icon">
            <FiUser size={16} />
            <input id="name" className="input" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" autoComplete="name" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-with-icon">
            <FiMail size={16} />
            <input id="email" className="input" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@company.com" autoComplete="email" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" value={form.password} onChange={onChange} placeholder="Create a strong password" autoComplete="new-password" />
          <div className="pw-meter" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={score >= n ? `on-${score}` : ""} />
            ))}
          </div>
          <span className="hint">{PASSWORD_RULE}</span>
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <PasswordInput id="confirm" name="confirm" value={form.confirm} onChange={onChange} placeholder="Repeat password" autoComplete="new-password" />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

export function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return toast.error("Please enter a valid email");
    setBusy(true);
    try {
      const data = await UsersAPI.forgot(email);
      setSent(true);
      toast.success(data.message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      icon={<FiKey size={24} />}
      title="Forgot your password?"
      subtitle="We'll email you a secure link to reset it."
      footer={<Link to="/app/login-user">← Back to login</Link>}
    >
      {sent ? (
        <div className="empty" style={{ padding: "1rem 0" }}>
          <FiCheckCircle size={44} color="#34d399" />
          <h3 className="mt-2">Check your inbox</h3>
          <p>If an account exists for <b style={{ color: "var(--text)" }}>{email}</b>, a reset link is on its way. It expires in 30 minutes.</p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <FiMail size={16} />
              <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPage() {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const score = strengthScore(form.password);

  const submit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(form.password)) return toast.error(PASSWORD_RULE);
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const data = await UsersAPI.reset(resetToken, { password: form.password, confirmPassword: form.confirm });
      toast.success(data.message);
      navigate("/app/login-user");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell icon={<FiLock size={24} />} title="Set a new password" subtitle="Choose something strong and unique.">
      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="password">New password</label>
          <PasswordInput id="password" name="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New password" autoComplete="new-password" />
          <div className="pw-meter" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={score >= n ? `on-${score}` : ""} />
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <PasswordInput id="confirm" name="confirm" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat password" autoComplete="new-password" />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
}

export function ConfirmEmailPage() {
  const { confirmEmailToken } = useParams();
  const [state, setState] = useState({ status: "loading", message: "" });
  // Guards against React StrictMode running the effect twice; the token is single-use.
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    UsersAPI.confirm(confirmEmailToken)
      .then((data) => setState({ status: "ok", message: data.message }))
      .catch((err) => setState({ status: "error", message: errorMessage(err) }));
  }, [confirmEmailToken]);

  return (
    <AuthShell icon={state.status === "error" ? <FiXCircle size={24} /> : <FiBox size={24} />} title="Email verification">
      <div className="empty" style={{ padding: "1rem 0" }}>
        {state.status === "loading" && <Spinner label="Verifying your email…" />}
        {state.status === "ok" && (
          <>
            <FiCheckCircle size={44} color="#34d399" />
            <h3 className="mt-2">You're verified</h3>
            <p>{state.message}</p>
            <Link className="btn btn-primary mt-2" to="/app/login-user">Continue to login</Link>
          </>
        )}
        {state.status === "error" && (
          <>
            <FiXCircle size={44} color="#fb7185" />
            <h3 className="mt-2">Link not valid</h3>
            <p>{state.message}. Log in to request a fresh verification link.</p>
            <Link className="btn mt-2" to="/app/login-user">Go to login</Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
