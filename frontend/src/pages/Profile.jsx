import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiUser, FiPhone, FiMail, FiEdit3, FiLock, FiCamera, FiSave, FiArrowLeft } from "react-icons/fi";
import { selectAuth, updateProfile } from "../store/authSlice";
import { UsersAPI, errorMessage } from "../api";
import { PageHeader, Field } from "../components/ui";
import { initials, PASSWORD_RULE, isStrongPassword } from "../utils";

function Avatar({ user, size = "big" }) {
  if (user?.photo) return <img className={size === "big" ? "big-avatar" : "avatar"} src={user.photo} alt={user.name} />;
  return <div className={size === "big" ? "big-avatar-fallback" : "avatar"}>{initials(user?.name)}</div>;
}

export function ProfilePage() {
  const { user } = useSelector(selectAuth);
  return (
    <div className="stack" style={{ gap: "1.4rem" }}>
      <PageHeader title="Your profile" subtitle="How your account appears across InventoryEasePro." actions={<Link className="btn btn-primary" to="/app/account/edit-profile"><FiEdit3 /> Edit profile</Link>} />
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
        <div className="glass stack" style={{ gap: "1.4rem" }}>
          <div className="profile-hero">
            <Avatar user={user} />
            <div>
              <h2 style={{ margin: 0 }}>{user?.name}</h2>
              <span className="badge badge-success" style={{ marginTop: ".5rem" }}>Verified account</span>
            </div>
          </div>
          <div className="info-list">
            <div><small>Email</small><span>{user?.email}</span></div>
            <div><small>Phone</small><span>{user?.phone || "—"}</span></div>
            <div><small>Bio</small><span style={{ color: "var(--text-dim)" }}>{user?.bio || "No bio yet"}</span></div>
          </div>
        </div>
        <ChangePasswordCard />
      </div>
    </div>
  );
}

export function EditProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const [form, setForm] = useState({ name: "", phone: "", bio: "" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", phone: user.phone || "", bio: user.bio || "" });
  }, [user]);

  useEffect(() => () => preview.startsWith("blob:") && URL.revokeObjectURL(preview), [preview]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return toast.error("Use a jpg, jpeg, png or webp image");
    if (f.size > 5 * 1024 * 1024) return toast.error("Image must be 5MB or smaller");
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    const data = new FormData();
    data.append("name", form.name.trim());
    data.append("phone", form.phone.trim());
    data.append("bio", form.bio);
    if (photo) data.append("photo", photo);

    setBusy(true);
    try {
      await dispatch(updateProfile(data)).unwrap();
      toast.success("Profile updated");
      navigate("/app/account/profile");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ gap: "1.4rem", maxWidth: 900 }}>
      <PageHeader title="Edit profile" subtitle="Update your details. Email can't be changed." actions={<Link className="btn btn-ghost" to="/app/account/profile"><FiArrowLeft /> Back</Link>} />
      <form onSubmit={submit} className="grid" style={{ gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.4fr)", alignItems: "start" }}>
        <div className="glass stack" style={{ gap: "1rem", alignItems: "center", textAlign: "center" }}>
          {preview ? <img className="big-avatar" src={preview} alt="New avatar preview" /> : <Avatar user={user} />}
          <label className="btn btn-sm" htmlFor="photo"><FiCamera /> Change photo</label>
          <input id="photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} hidden />
          <span className="hint">JPG, PNG or WEBP · up to 5MB</span>
        </div>
        <div className="glass">
          <div className="form-grid">
            <Field label="Full name" className="span-2">
              <div className="input-with-icon"><FiUser size={16} /><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            </Field>
            <Field label="Email" className="span-2" hint="Email can't be changed.">
              <div className="input-with-icon"><FiMail size={16} /><input className="input" value={user?.email || ""} disabled /></div>
            </Field>
            <Field label="Phone">
              <div className="input-with-icon"><FiPhone size={16} /><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91" /></div>
            </Field>
            <Field label="Bio" className="span-2" hint={`${form.bio.length}/250`}>
              <textarea className="textarea" maxLength={250} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ minHeight: 110 }} />
            </Field>
          </div>
          <div className="row mt-2" style={{ justifyContent: "flex-end" }}>
            <Link className="btn btn-ghost" to="/app/account/profile">Cancel</Link>
            <button className="btn btn-primary" disabled={busy} type="submit"><FiSave /> {busy ? "Saving…" : "Save changes"}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ChangePasswordCard() {
  const [form, setForm] = useState({ oldPassword: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error("New passwords do not match");
    if (!isStrongPassword(form.password)) return toast.error(PASSWORD_RULE);
    setBusy(true);
    try {
      const data = await UsersAPI.changePassword(form);
      toast.success(data.message);
      setForm({ oldPassword: "", password: "", confirmPassword: "" });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="glass stack" style={{ gap: "1rem" }} onSubmit={submit}>
      <div className="row"><FiLock /><h3 style={{ margin: 0 }}>Change password</h3></div>
      <Field label="Current password">
        <input className="input" type="password" autoComplete="current-password" value={form.oldPassword} onChange={(e) => setForm({ ...form, oldPassword: e.target.value })} required />
      </Field>
      <Field label="New password">
        <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </Field>
      <Field label="Confirm new password" hint={PASSWORD_RULE}>
        <input className="input" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
      </Field>
      <button className="btn btn-primary" disabled={busy} type="submit" style={{ alignSelf: "flex-start" }}>
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
