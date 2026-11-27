import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiShoppingCart,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiSearch,
  FiEye,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiPackage,
} from "react-icons/fi";
import {
  fetchSalesOrders,
  deleteSalesOrder,
  selectSalesOrders,
  selectSalesStats,
} from "../store/salesOrderSlice";
import { StatCard, ConfirmDialog, PageHeader, EmptyState, Spinner } from "../components/ui";
import { formatINR, formatNumber, formatDate, orderStatusBadge, paymentStatusBadge } from "../utils";
import { errorMessage } from "../api";

const PAGE_SIZE = 8;

export default function SalesOrders() {
  const dispatch = useDispatch();
  const { items, listLoading } = useSelector(selectSalesOrders);
  const stats = useSelector(selectSalesStats);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchSalesOrders())
      .unwrap()
      .catch((err) => toast.error(errorMessage(err)));
  }, [dispatch]);

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.customer?.name || "").toLowerCase().includes(q) ||
          (o.customer?.company || "").toLowerCase().includes(q) ||
          (o.notes || "").toLowerCase().includes(q)
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
      await dispatch(deleteSalesOrder(target._id)).unwrap();
      toast.success("Sales order deleted and stock adjusted");
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
        title="Sales Orders"
        subtitle="Sell items to customers with automatic real-time stock deduction."
        actions={
          <Link className="btn btn-primary" to="/app/add-sales-order">
            <FiPlus /> New sales order
          </Link>
        }
      />

      <div className="grid grid-4">
        <StatCard
          icon={<FiShoppingCart size={20} />}
          label="Total orders"
          value={formatNumber(stats.total)}
          accent="indigo"
          delay={0}
        />
        <StatCard
          icon={<FiDollarSign size={20} />}
          label="Total sales revenue"
          value={formatINR(stats.revenue)}
          accent="emerald"
          delay={0.08}
        />
        <StatCard
          icon={<FiCheckCircle size={20} />}
          label="Completed"
          value={formatNumber(stats.completed)}
          accent="cyan"
          delay={0.16}
        />
        <StatCard
          icon={<FiClock size={20} />}
          label="Pending"
          value={formatNumber(stats.pending)}
          accent="amber"
          delay={0.24}
        />
      </div>

      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        <div className="toolbar">
          <div>
            <h3 className="panel-title">Sales Records</h3>
            <span className="muted">
              {filtered.length} of {items.length} orders shown
            </span>
          </div>
          <div className="row" style={{ gap: ".8rem" }}>
            <div className="row" style={{ gap: ".35rem" }}>
              {["all", "completed", "pending", "cancelled"].map((s) => (
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
                placeholder="Search order #, customer or notes"
                value={query}
                onChange={onQuery}
                aria-label="Search sales orders"
              />
            </div>
          </div>
        </div>

        {listLoading && items.length === 0 ? (
          <Spinner label="Loading sales orders…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FiShoppingCart size={26} />}
            title="No sales orders yet"
            action={
              <Link className="btn btn-primary" to="/app/add-sales-order">
                Create first sales order
              </Link>
            }
          >
            Sell products directly to registered customers. Your inventory levels will deduct automatically in real time.
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FiSearch size={26} />} title="No orders match">
            Nothing matches “{query}”. Try adjusting your filters.
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none", borderRadius: 0, background: "transparent" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th className="num">Total Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const st = orderStatusBadge(o.status);
                    const pt = paymentStatusBadge(o.paymentStatus);
                    return (
                      <tr key={o._id}>
                        <td>
                          <Link
                            to={`/app/sales-order-detail/${o._id}`}
                            style={{ fontWeight: 700, color: "var(--indigo)" }}
                          >
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 600 }}>{o.customer?.name || "Customer"}</span>
                            {o.customer?.company && (
                              <div className="muted" style={{ fontSize: ".78rem" }}>
                                {o.customer.company}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="muted" style={{ fontSize: ".85rem" }}>
                          {formatDate(o.orderDate || o.createdAt)}
                        </td>
                        <td>
                          <span className="row" style={{ gap: ".35rem" }}>
                            <FiPackage size={14} className="muted" />
                            <span>
                              {o.items?.length || 0} {o.items?.length === 1 ? "item" : "items"}
                            </span>
                          </span>
                        </td>
                        <td className="num" style={{ fontWeight: 700, color: "var(--text)" }}>
                          {formatINR(o.totalAmount)}
                        </td>
                        <td>
                          <span className={`badge badge-${st.tone}`}>{st.label}</span>
                        </td>
                        <td>
                          <span className={`badge badge-${pt.tone}`}>{pt.label}</span>
                        </td>
                        <td>
                          <div className="actions">
                            <Link
                              className="icon-btn view"
                              to={`/app/sales-order-detail/${o._id}`}
                              aria-label="View sales order"
                              title="View invoice"
                            >
                              <FiEye size={16} />
                            </Link>
                            <button
                              type="button"
                              className="icon-btn delete"
                              aria-label="Delete order"
                              title="Delete order"
                              onClick={() => setTarget(o)}
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
        title="Delete sales order?"
        message={
          target
            ? `Order “${target.orderNumber}” will be deleted. If this order was marked Completed, the inventory stock will be restored automatically.`
            : ""
        }
        confirmLabel="Delete sales order"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setTarget(null)}
      />
    </div>
  );
}
