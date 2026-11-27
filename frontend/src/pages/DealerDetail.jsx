import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiTruck,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiFileText,
  FiTag,
} from "react-icons/fi";
import {
  fetchDealer,
  deleteDealer,
  selectDealers,
} from "../store/dealerSlice";
import { FullScreenLoader, EmptyState, ConfirmDialog } from "../components/ui";
import { formatDate, initials } from "../utils";
import { errorMessage } from "../api";

export default function DealerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: dealer, currentLoading } = useSelector(selectDealers);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchDealer(id))
      .unwrap()
      .catch((err) => toast.error(errorMessage(err)));
  }, [id, dispatch]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteDealer(id)).unwrap();
      toast.success("Dealer deleted");
      navigate("/app/dealers");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (currentLoading && (!dealer || dealer._id !== id)) return <FullScreenLoader />;
  if (!dealer || dealer._id !== id) {
    return (
      <div className="glass">
        <EmptyState
          icon={<FiTruck size={26} />}
          title="Dealer not found"
          action={
            <Link className="btn btn-primary" to="/app/dealers">
              Back to dealers
            </Link>
          }
        >
          This dealer profile may have been removed, or you don't have access to it.
        </EmptyState>
      </div>
    );
  }

  const isActive = dealer.status === "active";

  return (
    <div className="stack" style={{ gap: "1.4rem" }}>
      <div className="spread">
        <Link className="btn btn-ghost" to="/app/dealers">
          <FiArrowLeft /> Back to dealers
        </Link>
        <div className="row" style={{ gap: ".8rem" }}>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDelete(true)}
          >
            <FiTrash2 /> Delete
          </button>
          <Link className="btn btn-primary" to={`/app/edit-dealer/${dealer._id}`}>
            <FiEdit2 /> Edit dealer
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
              {initials(dealer.name)}
            </div>
            <h2 style={{ margin: "0 0 .3rem" }}>{dealer.name}</h2>
            {dealer.company && (
              <p className="muted" style={{ margin: "0 0 .8rem", fontSize: ".95rem" }}>
                <FiBriefcase style={{ verticalAlign: "-2px", marginRight: 6 }} />
                {dealer.company}
              </p>
            )}
            <div className="row" style={{ justifyContent: "center", gap: ".5rem" }}>
              <span className={`badge ${isActive ? "badge-success" : "badge-danger"}`}>
                {isActive ? "Active Supplier" : "Inactive"}
              </span>
              <span className="chip">
                <FiTag size={12} style={{ verticalAlign: "-2px" }} /> {dealer.category || "General"}
              </span>
            </div>
          </div>

          <div className="spread" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", gap: ".6rem" }}>
            <a
              href={`mailto:${dealer.email}`}
              className="btn btn-ghost btn-block"
              style={{ flex: 1, padding: ".6rem" }}
            >
              <FiMail /> Email
            </a>
            <a
              href={`tel:${dealer.phone}`}
              className="btn btn-ghost btn-block"
              style={{ flex: 1, padding: ".6rem" }}
            >
              <FiPhone /> Call
            </a>
          </div>
        </div>

        <div className="glass stack" style={{ gap: "1.4rem" }}>
          <div>
            <span className="eyebrow">Supplier Profile</span>
            <p className="muted" style={{ margin: ".6rem 0 0", fontSize: ".85rem" }}>
              ID · {dealer._id}
            </p>
          </div>

          <div className="info-list" style={{ marginTop: 0 }}>
            <div>
              <small>Email</small>
              <b style={{ color: "var(--text)" }}>{dealer.email}</b>
            </div>
            <div>
              <small>Phone</small>
              <b style={{ color: "var(--text)" }}>{dealer.phone}</b>
            </div>
            <div>
              <small>Company</small>
              <b>{dealer.company || "—"}</b>
            </div>
            <div>
              <small>Category</small>
              <b>{dealer.category || "General"}</b>
            </div>
            <div>
              <small>Warehouse / Address</small>
              <b>{dealer.address || "—"}</b>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "1rem", color: "var(--text)", display: "flex", alignItems: "center", gap: ".5rem" }}>
              <FiFileText /> Terms & Notes
            </h4>
            <div className="description">
              {dealer.notes ? dealer.notes : <span className="muted">No supply terms or notes recorded.</span>}
            </div>
          </div>

          <div className="stack" style={{ gap: ".5rem", fontSize: ".88rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <span className="muted">
              <FiCalendar size={14} style={{ verticalAlign: "-2px" }} /> Added {formatDate(dealer.createdAt)}
            </span>
            <span className="muted">
              <FiClock size={14} style={{ verticalAlign: "-2px" }} /> Last updated {formatDate(dealer.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        danger
        title="Delete dealer?"
        message={`“${dealer.name}” will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete dealer"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setShowDelete(false)}
      />
    </div>
  );
}
