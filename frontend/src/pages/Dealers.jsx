import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiLayers,
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import {
  fetchDealers,
  deleteDealer,
  selectDealers,
  selectDealerStats,
} from "../store/dealerSlice";
import { StatCard, ConfirmDialog, PageHeader, EmptyState, Spinner } from "../components/ui";
import { formatNumber, shorten } from "../utils";
import { errorMessage } from "../api";

const PAGE_SIZE = 8;

export default function Dealers() {
  const dispatch = useDispatch();
  const { items, listLoading } = useSelector(selectDealers);
  const stats = useSelector(selectDealerStats);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchDealers())
      .unwrap()
      .catch((err) => toast.error(errorMessage(err)));
  }, [dispatch]);

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.phone.toLowerCase().includes(q) ||
          (d.company || "").toLowerCase().includes(q) ||
          (d.category || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const onQuery = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await dispatch(deleteDealer(target._id)).unwrap();
      toast.success("Dealer removed successfully");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
      setTarget(null);
    }
  };

  return (
    <div className="stack" style={{ gap: "1.6rem" }}>
      <PageHeader
        title="Dealers & Suppliers"
        subtitle="Manage product suppliers, vendor contacts, and procurement channels."
        actions={
          <Link className="btn btn-primary" to="/app/add-dealer">
            <FiPlus /> Add dealer
          </Link>
        }
      />

      <div className="grid grid-4">
        <StatCard
          icon={<FiTruck size={20} />}
          label="Total dealers"
          value={formatNumber(stats.total)}
          accent="indigo"
          delay={0}
        />
        <StatCard
          icon={<FiCheckCircle size={20} />}
          label="Active suppliers"
          value={formatNumber(stats.active)}
          accent="emerald"
          delay={0.08}
        />
        <StatCard
          icon={<FiXCircle size={20} />}
          label="Inactive"
          value={formatNumber(stats.inactive)}
          accent="rose"
          delay={0.16}
        />
        <StatCard
          icon={<FiLayers size={20} />}
          label="Categories"
          value={formatNumber(stats.categories)}
          accent="cyan"
          delay={0.24}
        />
      </div>

      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        <div className="toolbar">
          <div>
            <h3 className="panel-title">Suppliers Directory</h3>
            <span className="muted">
              {filtered.length} of {items.length} records shown
            </span>
          </div>
          <div className="row" style={{ gap: ".8rem" }}>
            <div className="row" style={{ gap: ".35rem" }}>
              {["all", "active", "inactive"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}
                  style={{ textTransform: "capitalize", padding: "0.35rem 0.75rem" }}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="search">
              <FiSearch size={16} />
              <input
                className="input"
                placeholder="Search name, company, email or category"
                value={query}
                onChange={onQuery}
                aria-label="Search dealers"
              />
            </div>
          </div>
        </div>

        {listLoading && items.length === 0 ? (
          <Spinner label="Loading dealers directory…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FiTruck size={26} />}
            title="No dealers yet"
            action={
              <Link className="btn btn-primary" to="/app/add-dealer">
                Add your first dealer
              </Link>
            }
          >
            Connect suppliers and vendors to facilitate inventory purchasing and restock orders.
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FiSearch size={26} />} title="No matches found">
            Nothing matches “{query}”. Try adjusting your search query or filter.
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none", borderRadius: 0, background: "transparent" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Dealer / Supplier</th>
                    <th>Category</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d, i) => {
                    const serial = (current - 1) * PAGE_SIZE + i + 1;
                    const isActive = d.status === "active";
                    return (
                      <tr key={d._id}>
                        <td className="muted">{serial}</td>
                        <td>
                          <div>
                            <Link
                              to={`/app/dealer-detail/${d._id}`}
                              style={{ fontWeight: 600, color: "var(--text)" }}
                              title={d.name}
                            >
                              {shorten(d.name, 26)}
                            </Link>
                            {d.company && (
                              <div className="muted" style={{ fontSize: ".78rem" }}>
                                {d.company}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="chip">{d.category || "General"}</span>
                        </td>
                        <td>
                          <a
                            href={`mailto:${d.email}`}
                            className="row"
                            style={{ gap: ".4rem", color: "var(--text-dim)", textDecoration: "none" }}
                          >
                            <FiMail size={14} className="muted" />
                            <span>{d.email}</span>
                          </a>
                        </td>
                        <td>
                          <a
                            href={`tel:${d.phone}`}
                            className="row"
                            style={{ gap: ".4rem", color: "var(--text-dim)", textDecoration: "none" }}
                          >
                            <FiPhone size={14} className="muted" />
                            <span>{d.phone}</span>
                          </a>
                        </td>
                        <td>
                          <span className={`badge ${isActive ? "badge-success" : "badge-danger"}`}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="actions">
                            <Link
                              className="icon-btn view"
                              to={`/app/dealer-detail/${d._id}`}
                              aria-label="View dealer"
                              title="View details"
                            >
                              <FiEye size={16} />
                            </Link>
                            <Link
                              className="icon-btn edit"
                              to={`/app/edit-dealer/${d._id}`}
                              aria-label="Edit dealer"
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </Link>
                            <button
                              type="button"
                              className="icon-btn delete"
                              aria-label="Delete dealer"
                              title="Delete"
                              onClick={() => setTarget(d)}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={current <= 1}
                  aria-label="Previous page"
                >
                  <FiChevronLeft size={16} />
                </button>
                <span className="muted" style={{ fontSize: ".85rem" }}>
                  Page {current} of {pageCount}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={current >= pageCount}
                  aria-label="Next page"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        danger
        title="Delete dealer?"
        message={
          target
            ? `Dealer “${target.name}” will be permanently removed. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete dealer"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setTarget(null)}
      />
    </div>
  );
}
