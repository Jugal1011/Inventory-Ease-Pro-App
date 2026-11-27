import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiTruck, FiMail, FiPhone, FiBriefcase, FiMapPin, FiTag } from "react-icons/fi";
import {
  createDealer,
  updateDealer,
  fetchDealer,
  selectDealers,
} from "../store/dealerSlice";
import { PageHeader, Field, FullScreenLoader } from "../components/ui";
import { errorMessage } from "../api";
import { isValidEmail } from "../utils";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  company: "",
  category: "General",
  address: "",
  status: "active",
  notes: "",
};

export default function DealerForm({ mode }) {
  const isEdit = mode === "edit";
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, currentLoading, saving } = useSelector(selectDealers);

  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(!isEdit);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    dispatch(fetchDealer(id))
      .unwrap()
      .then(() => setLoaded(true))
      .catch((err) => toast.error(errorMessage(err)));
  }, [isEdit, id, dispatch]);

  useEffect(() => {
    if (!isEdit || !current || current._id !== id) return;
    setForm({
      name: current.name || "",
      email: current.email || "",
      phone: current.phone || "",
      company: current.company || "",
      category: current.category || "General",
      address: current.address || "",
      status: current.status || "active",
      notes: current.notes || "",
    });
  }, [isEdit, current, id]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Dealer / Contact name is required";
    if (!form.email.trim()) {
      e.email = "Email address is required";
    } else if (!isValidEmail(form.email)) {
      e.email = "Please enter a valid email address";
    }
    if (!form.phone.trim()) e.phone = "Phone number is required";
    return e;
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    setAttempted(true);
    if (Object.keys(errors).length) {
      return toast.error(Object.values(errors)[0]);
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      category: form.category.trim() || "General",
      address: form.address.trim(),
      status: form.status,
      notes: form.notes.trim(),
    };

    try {
      if (isEdit) {
        await dispatch(updateDealer({ id, data: payload })).unwrap();
        toast.success("Dealer updated successfully");
      } else {
        await dispatch(createDealer(payload)).unwrap();
        toast.success("Dealer added successfully");
      }
      navigate("/app/dealers");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (isEdit && (!loaded || currentLoading)) return <FullScreenLoader />;

  const title = isEdit ? "Edit dealer" : "Add dealer";
  const subtitle = isEdit
    ? "Update supplier details, contact info or supply category."
    : "Register a new stock supplier or vendor.";

  return (
    <div className="stack" style={{ gap: "1.4rem", maxWidth: 860 }}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link className="btn btn-ghost" to="/app/dealers">
            <FiArrowLeft /> Back to dealers
          </Link>
        }
      />

      <form onSubmit={submit} className="glass stack" style={{ gap: "1.5rem" }} noValidate>
        <div className="form-grid">
          <Field label="Dealer / Contact name *" hint={attempted && errors.name}>
            <div className="input-with-icon">
              <FiTruck />
              <input
                className="input"
                name="name"
                placeholder="e.g. Ramesh Patel"
                value={form.name}
                onChange={onChange}
                autoFocus={!isEdit}
              />
            </div>
          </Field>

          <Field label="Supplier company" hint="Distribution or manufacturing entity">
            <div className="input-with-icon">
              <FiBriefcase />
              <input
                className="input"
                name="company"
                placeholder="e.g. National Hardware Distributors"
                value={form.company}
                onChange={onChange}
              />
            </div>
          </Field>

          <Field label="Email address *" hint={attempted && errors.email}>
            <div className="input-with-icon">
              <FiMail />
              <input
                type="email"
                className="input"
                name="email"
                placeholder="e.g. sales@nationalhardware.com"
                value={form.email}
                onChange={onChange}
              />
            </div>
          </Field>

          <Field label="Phone number *" hint={attempted && errors.phone}>
            <div className="input-with-icon">
              <FiPhone />
              <input
                type="tel"
                className="input"
                name="phone"
                placeholder="e.g. +91 98765 12345"
                value={form.phone}
                onChange={onChange}
              />
            </div>
          </Field>

          <Field label="Supply category">
            <div className="input-with-icon">
              <FiTag />
              <input
                className="input"
                name="category"
                placeholder="e.g. Electronics, Raw Materials, Packaging"
                value={form.category}
                onChange={onChange}
              />
            </div>
          </Field>

          <Field label="Status">
            <select className="select" name="status" value={form.status} onChange={onChange}>
              <option value="active">Active (current supplier)</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Address / Warehouse location" className="span-2">
            <div className="input-with-icon">
              <FiMapPin />
              <input
                className="input"
                name="address"
                placeholder="e.g. Plot 12, Industrial Area, Sector 5, Pune"
                value={form.address}
                onChange={onChange}
              />
            </div>
          </Field>

          <Field label="Notes & Terms" className="span-2" hint="Credit terms, lead times, delivery notes">
            <textarea
              className="textarea"
              name="notes"
              placeholder="e.g. 30-day net payment terms, 3 business days lead time..."
              value={form.notes}
              onChange={onChange}
              rows={4}
            />
          </Field>
        </div>

        <div className="spread" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
          <Link className="btn btn-ghost" to="/app/dealers">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FiSave /> {saving ? "Saving…" : isEdit ? "Update dealer" : "Add dealer"}
          </button>
        </div>
      </form>
    </div>
  );
}
