import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
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
  fetchCustomers,
  deleteCustomer,
  selectCustomers,
  selectCustomerStats,
} from "../store/customerSlice";
import { StatCard, ConfirmDialog, PageHeader, EmptyState, Spinner } from "../components/ui";
import { customerStatus, formatNumber, shorten } from "../utils";
import { errorMessage } from "../api";

const PAGE_SIZE = 8;

export default function Customers() {
  const dispatch = useDispatch();
  const { items, listLoading } = useSelector(selectCustomers);
  const stats = useSelector(selectCustomerStats);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers())
      .unwrap()
      .catch((err) => toast.error(errorMessage(err)));
  }, [dispatch]);

  const filtered = useMemo(() => {
    let result = items;

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.company || "").toLowerCase().includes(q)
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

  const onStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await dispatch(deleteCustomer(target._id)).unwrap();
      toast.success("Customer removed successfully");
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
        title="Customer Directory"
        subtitle="Manage client relationships, contact details, leads, and notes."
        actions={
          <Link className="btn btn-primary" to="/app/add-customer">
            <FiPlus /> Add customer
          </Link>
        }
      />

      <div className="grid grid-4">
        <StatCard
          icon={<FiUsers size={20} />}
          label="Total customers"
          value={formatNumber(stats.total)}
          accent="indigo"
          delay={0}
        />
        <StatCard
          icon={<FiUserCheck size={20} />}
          label="Active clients"
          value={formatNumber(stats.active)}
          accent="emerald"
          delay={0.08}
        />
        <StatCard
          icon={<FiTrendingUp size={20} />}
          label="Leads"
          value={formatNumber(stats.lead)}
          accent="amber"
          delay={0.16}
        />
        <StatCard
          icon={<FiUserX size={20} />}
          label="Inactive"
          value={formatNumber(stats.inactive)}
          accent="rose"
          delay={0.24}
        />
      </div>

      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        <div className="toolbar">
          <div>
            <h3 className="panel-title">Customers</h3>
            <span className="muted">
              {filtered.length} of {items.length} records shown
            </span>
          </div>
          <div className="row" style={{ gap: ".8rem" }}>
            <div className="row" style={{ gap: ".35rem" }}>
              {["all", "active", "lead", "inactive"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}
                  style={{ textTransform: "capitalize", padding: "0.35rem 0.75rem" }}
                  onClick={() => onStatusChange(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="search">
              <FiSearch size={16} />
              <input
                className="input"
                placeholder="Search name, email, phone or company"
                value={query}
                onChange={onQuery}
                aria-label="Search customers"
              />
            </div>
          </div>
        </div>

        {listLoading && items.length === 0 ? (
          <Spinner label="Loading customer directory…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FiUsers size={26} />}
            title="No customers yet"
            action={
              <Link className="btn btn-primary" to="/app/add-customer">
                Add your first customer
              </Link>
            }
          >
            Start keeping track of your customers, leads, companies, and contact histories in one place.
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FiSearch size={26} />} title="No matches found">
            Nothing matches “{query}” with status “{statusFilter}”. Try adjusting your filters.
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none", borderRadius: 0, background: "transparent" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c, i) => {
                    const status = customerStatus(c.status);
                    const serial = (current - 1) * PAGE_SIZE + i + 1;
                    return (
                      <tr key={c._id}>
                        <td className="muted">{serial}</td>
                        <td>
                          <div>
                            <Link
                              to={`/app/customer-detail/${c._id}`}
                              style={{ fontWeight: 600, color: "var(--text)" }}
                              title={c.name}
                            >
                              {shorten(c.name, 26)}
                            </Link>
                            {c.company && (
                              <div className="muted" style={{ fontSize: ".78rem" }}>
                                {c.company}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <a
                            href={`mailto:${c.email}`}
                            className="row"
                            style={{ gap: ".4rem", color: "var(--text-dim)", textDecoration: "none" }}
                          >
                            <FiMail size={14} className="muted" />
                            <span>{c.email}</span>
                          </a>
                        </td>
                        <td>
                          <a
                            href={`tel:${c.phone}`}
                            className="row"
                            style={{ gap: ".4rem", color: "var(--text-dim)", textDecoration: "none" }}
                          >
                            <FiPhone size={14} className="muted" />
                            <span>{c.phone}</span>
                          </a>
                        </td>
                        <td>
                          <span className={`badge badge-${status.tone}`}>{status.label}</span>
                        </td>
                        <td>
                          <div className="actions">
                            <Link
                              className="icon-btn view"
                              to={`/app/customer-detail/${c._id}`}
                              aria-label="View customer"
                              title="View details"
                            >
                              <FiEye size={16} />
                            </Link>
                            <Link
                              className="icon-btn edit"
                              to={`/app/edit-customer/${c._id}`}
                              aria-label="Edit customer"
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </Link>
                            <button
                              type="button"
                              className="icon-btn delete"
                              aria-label="Delete customer"
                              title="Delete"
                              onClick={() => setTarget(c)}
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
        title="Delete customer?"
        message={
          target
            ? `Customer “${target.name}” will be permanently removed. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete customer"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setTarget(null)}
      />
    </div>
  );
}
