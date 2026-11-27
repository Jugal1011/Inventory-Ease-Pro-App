import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin } from "react-icons/fi";
import {
  createCustomer,
  updateCustomer,
  fetchCustomer,
  selectCustomers,
} from "../store/customerSlice";
import { PageHeader, Field, FullScreenLoader } from "../components/ui";
import { errorMessage } from "../api";
import { isValidEmail } from "../utils";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  status: "active",
  notes: "",
};

export default function CustomerForm({ mode }) {
  const isEdit = mode === "edit";
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, currentLoading, saving } = useSelector(selectCustomers);

  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(!isEdit);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    dispatch(fetchCustomer(id))
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
      address: current.address || "",
      status: current.status || "active",
      notes: current.notes || "",
    });
  }, [isEdit, current, id]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Customer name is required";
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
      address: form.address.trim(),
      status: form.status,
      notes: form.notes.trim(),
    };

    try {
      if (isEdit) {
        await dispatch(updateCustomer({ id, data: payload })).unwrap();
        toast.success("Customer updated successfully");
      } else {
        await dispatch(createCustomer(payload)).unwrap();
        toast.success("Customer added successfully");
      }
      navigate("/app/customers");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (isEdit && (!loaded || currentLoading)) return <FullScreenLoader />;

  const title = isEdit ? "Edit customer" : "Add customer";
  const subtitle = isEdit
    ? "Update customer contact information, status or notes."
    : "Add a new client or lead to your directory.";

  return (
    <div className="stack" style={{ gap: "1.4rem", maxWidth: 860 }}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link className="btn btn-ghost" to="/app/customers">
            <FiArrowLeft /> Back to customers
          </Link>
        }
      />

      <form onSubmit={submit} className="glass stack" style={{ gap: "1.5rem" }} noValidate>
        <div className="form-grid">
          <Field label="Customer name *" hint={attempted && errors.name}>
            <div className="input-with-icon">
              <FiUser />
              <input
                className="input"
                name="name"
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={onChange}
                autoFocus={!isEdit}
              />
            </div>
          </Field>

          <Field label="Company name" hint="Optional business / organization">
            <div className="input-with-icon">
              <FiBriefcase />
              <input
                className="input"
                name="company"
                placeholder="e.g. Apex Logistics Pvt Ltd"
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
                placeholder="e.g. rahul@example.com"
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
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={onChange}
              />
            </div>
          </Field>

          <Field label="Status">
            <select className="select" name="status" value={form.status} onChange={onChange}>
              <option value="active">Active (current client)</option>
              <option value="lead">Lead (prospective buyer)</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

          <Field label="Address" className="span-2">
            <div className="input-with-icon">
              <FiMapPin />
              <input
                className="input"
                name="address"
                placeholder="e.g. Suite 402, Trade Tower, Mumbai, MH"
                value={form.address}
                onChange={onChange}
              />
            </div>
          </Field>

          <Field label="Notes & Context" className="span-2" hint="Special requirements, billing preferences, past orders">
            <textarea
              className="textarea"
              name="notes"
              placeholder="Add any helpful background about this customer..."
              value={form.notes}
              onChange={onChange}
              rows={4}
            />
          </Field>
        </div>

        <div className="spread" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
          <Link className="btn btn-ghost" to="/app/customers">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FiSave /> {saving ? "Saving…" : isEdit ? "Update customer" : "Add customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
