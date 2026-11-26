import { useState } from "react";
import toast from "react-hot-toast";
import { FiPhone, FiMail, FiMapPin, FiSend, FiMessageSquare } from "react-icons/fi";
import { ContactAPI, errorMessage } from "../api";
import { PageHeader, Field } from "../components/ui";

const CHANNELS = [
  { icon: FiPhone, label: "Phone", value: "+91 8735041727", accent: "emerald" },
  { icon: FiMail, label: "Email", value: "sonijugal2002@gmail.com", accent: "indigo" },
  { icon: FiMapPin, label: "Location", value: "Vadodara, Gujarat, India", accent: "cyan" },
];

export default function Contact() {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await ContactAPI.send(form);
      toast.success(data.message);
      setForm({ subject: "", message: "" });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ gap: "1.4rem" }}>
      <PageHeader title="Report a bug or get in touch" subtitle="Tell us what's wrong or what you'd like to see next." />
      <div className="contact-grid">
        <form className="glass stack" style={{ gap: "1.1rem" }} onSubmit={submit}>
          <Field label="Subject">
            <input className="input" placeholder="Short summary" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required maxLength={150} />
          </Field>
          <Field label="Message" hint="Steps to reproduce help us fix things faster.">
            <textarea className="textarea" placeholder="What happened? What did you expect?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={5000} style={{ minHeight: 180 }} />
          </Field>
          <button className="btn btn-primary" disabled={busy} type="submit" style={{ alignSelf: "flex-start" }}>
            <FiSend /> {busy ? "Sending…" : "Send message"}
          </button>
        </form>

        <div className="glass">
          <span className="eyebrow"><FiMessageSquare size={12} /> Contact</span>
          <h3 className="mt-2">Our contact information</h3>
          <p style={{ fontSize: ".95rem" }}>Prefer another channel? Reach out directly.</p>
          <div className="mt-2">
            {CHANNELS.map(({ icon: Icon, label, value, accent }) => (
              <div key={label} className="contact-item">
                <span className={`stat-icon accent-${accent}`}><Icon size={18} /></span>
                <div>
                  <small className="muted" style={{ display: "block", textTransform: "uppercase", letterSpacing: ".08em", fontSize: ".72rem" }}>{label}</small>
                  <span style={{ color: "var(--text)" }}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
