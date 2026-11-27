import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import {
  fetchCustomer,
  deleteCustomer,
  selectCustomers,
} from "../store/customerSlice";
import { FullScreenLoader, EmptyState, ConfirmDialog } from "../components/ui";
import { formatDate, customerStatus, initials } from "../utils";
import { errorMessage } from "../api";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: customer, currentLoading } = useSelector(selectCustomers);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomer(id))
      .unwrap()
      .catch((err) => toast.error(errorMessage(err)));
  }, [id, dispatch]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteCustomer(id)).unwrap();
      toast.success("Customer deleted");
      navigate("/app/customers");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (currentLoading && (!customer || customer._id !== id)) return <FullScreenLoader />;
  if (!customer || customer._id !== id) {
    return (
      <div className="glass">
        <EmptyState
          icon={<FiUser size={26} />}
          title="Customer not found"
          action={
            <Link className="btn btn-primary" to="/app/customers">
              Back to customers
            </Link>
          }
        >
          This customer profile may have been deleted, or you don't have access to it.
        </EmptyState>
      </div>
    );
  }

  const status = customerStatus(customer.status);

  return (
    <div className="stack" style={{ gap: "1.4rem" }}>
      <div className="spread">
        <Link className="btn btn-ghost" to="/app/customers">
          <FiArrowLeft /> Back to customers
        </Link>
        <div className="row" style={{ gap: ".8rem" }}>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDelete(true)}
          >
            <FiTrash2 /> Delete
          </button>
          <Link className="btn btn-primary" to={`/app/edit-customer/${customer._id}`}>
            <FiEdit2 /> Edit customer
          </Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="glass stack" style={{ gap: "1.4rem" }}>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              className="avatar"
              style={{
                width: 80,
                height: 80,
                fontSize: "1.8rem",
                margin: "0 auto 1rem",
                borderRadius: "24px",
              }}
            >
              {initials(customer.name)}
            </div>
            <h2 style={{ margin: "0 0 .3rem" }}>{customer.name}</h2>
            {customer.company && (
              <p className="muted" style={{ margin: "0 0 .8rem", fontSize: ".95rem" }}>
                <FiBriefcase style={{ verticalAlign: "-2px", marginRight: 6 }} />
                {customer.company}
              </p>
            )}
            <span className={`badge badge-${status.tone}`}>{status.label}</span>
          </div>

          <div className="spread" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", gap: ".6rem" }}>
            <a
              href={`mailto:${customer.email}`}
              className="btn btn-ghost btn-block"
              style={{ flex: 1, padding: ".6rem" }}
            >
              <FiMail /> Email
            </a>
            <a
              href={`tel:${customer.phone}`}
              className="btn btn-ghost btn-block"
              style={{ flex: 1, padding: ".6rem" }}
            >
              <FiPhone /> Call
            </a>
          </div>
        </div>

        <div className="glass stack" style={{ gap: "1.4rem" }}>
          <div>
            <span className="eyebrow">Customer Record</span>
            <p className="muted" style={{ margin: ".6rem 0 0", fontSize: ".85rem" }}>
              ID · {customer._id}
            </p>
          </div>

          <div className="info-list" style={{ marginTop: 0 }}>
            <div>
              <small>Email</small>
              <b style={{ color: "var(--text)" }}>{customer.email}</b>
            </div>
            <div>
              <small>Phone</small>
              <b style={{ color: "var(--text)" }}>{customer.phone}</b>
            </div>
            <div>
              <small>Company</small>
              <b>{customer.company || "—"}</b>
            </div>
            <div>
              <small>Address</small>
              <b>{customer.address || "—"}</b>
            </div>
            <div>
              <small>Status</small>
              <b style={{ textTransform: "capitalize" }}>{customer.status}</b>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "1rem", color: "var(--text)", display: "flex", alignItems: "center", gap: ".5rem" }}>
              <FiFileText /> Notes & Remarks
            </h4>
            <div className="description">
              {customer.notes ? customer.notes : <span className="muted">No notes recorded yet.</span>}
            </div>
          </div>

          <div className="stack" style={{ gap: ".5rem", fontSize: ".88rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <span className="muted">
              <FiCalendar size={14} style={{ verticalAlign: "-2px" }} /> Created {formatDate(customer.createdAt)}
            </span>
            <span className="muted">
              <FiClock size={14} style={{ verticalAlign: "-2px" }} /> Last updated {formatDate(customer.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        danger
        title="Delete customer?"
        message={`“${customer.name}” will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete customer"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setShowDelete(false)}
      />
    </div>
  );
}
