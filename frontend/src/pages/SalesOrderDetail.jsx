import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
} from "react-icons/fi";
import {
  fetchSalesOrder,
  updateSalesOrderStatus,
  deleteSalesOrder,
  selectSalesOrders,
} from "../store/salesOrderSlice";
import { FullScreenLoader, EmptyState, ConfirmDialog } from "../components/ui";
import { formatINR, formatDate, orderStatusBadge, paymentStatusBadge } from "../utils";
import { errorMessage } from "../api";

export default function SalesOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: order, currentLoading } = useSelector(selectSalesOrders);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    dispatch(fetchSalesOrder(id))
      .unwrap()
      .catch((err) => toast.error(errorMessage(err)));
  }, [id, dispatch]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteSalesOrder(id)).unwrap();
      toast.success("Sales order deleted and stock restored");
      navigate("/app/sales-orders");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await dispatch(updateSalesOrderStatus({ id, data: { status: newStatus } })).unwrap();
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentChange = async (newPayment) => {
    setUpdating(true);
    try {
      await dispatch(updateSalesOrderStatus({ id, data: { paymentStatus: newPayment } })).unwrap();
      toast.success(`Payment status updated to ${newPayment}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  if (currentLoading && (!order || order._id !== id)) return <FullScreenLoader />;
  if (!order || order._id !== id) {
    return (
      <div className="glass">
        <EmptyState
          icon={<FiPackage size={26} />}
          title="Sales order not found"
          action={
            <Link className="btn btn-primary" to="/app/sales-orders">
              Back to sales orders
            </Link>
          }
        >
          This order might have been deleted, or you don't have access to it.
        </EmptyState>
      </div>
    );
  }

  const st = orderStatusBadge(order.status);
  const pt = paymentStatusBadge(order.paymentStatus);

  return (
    <div className="stack" style={{ gap: "1.4rem", maxWidth: 960 }}>
      <div className="spread">
        <Link className="btn btn-ghost" to="/app/sales-orders">
          <FiArrowLeft /> Back to sales orders
        </Link>
        <div className="row" style={{ gap: ".8rem" }}>
          {order.status === "pending" && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={updating}
              onClick={() => handleStatusChange("completed")}
            >
              <FiCheckCircle /> Mark Completed & Deduct Stock
            </button>
          )}
          {order.status === "completed" && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={updating}
              onClick={() => handleStatusChange("cancelled")}
              title="Restores stock back to inventory"
            >
              <FiXCircle /> Cancel & Restore Stock
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDelete(true)}
          >
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      <div className="glass stack" style={{ gap: "1.4rem" }}>
        <div className="spread">
          <div>
            <span className="eyebrow">Sales Invoice / Order</span>
            <h2 style={{ margin: ".6rem 0 .2rem" }}>{order.orderNumber}</h2>
            <span className="muted">
              <FiCalendar size={14} style={{ verticalAlign: "-2px" }} /> Placed on {formatDate(order.orderDate || order.createdAt)}
            </span>
          </div>

          <div className="row" style={{ gap: ".6rem" }}>
            <span className={`badge badge-${st.tone}`}>{st.label}</span>
            <span className={`badge badge-${pt.tone}`}>Payment: {pt.label}</span>
          </div>
        </div>

        <div className="grid grid-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
          <div className="stack" style={{ gap: ".4rem" }}>
            <h4 style={{ margin: 0, fontSize: ".95rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Billed To Customer
            </h4>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{order.customer?.name}</div>
            {order.customer?.company && <div className="muted">{order.customer.company}</div>}
            <div className="row" style={{ gap: ".8rem", marginTop: ".4rem" }}>
              {order.customer?.email && (
                <a href={`mailto:${order.customer.email}`} className="muted" style={{ fontSize: ".85rem" }}>
                  <FiMail size={13} style={{ verticalAlign: "-2px" }} /> {order.customer.email}
                </a>
              )}
              {order.customer?.phone && (
                <a href={`tel:${order.customer.phone}`} className="muted" style={{ fontSize: ".85rem" }}>
                  <FiPhone size={13} style={{ verticalAlign: "-2px" }} /> {order.customer.phone}
                </a>
              )}
            </div>
          </div>

          <div className="stack" style={{ gap: ".4rem" }}>
            <h4 style={{ margin: 0, fontSize: ".95rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Quick Status Actions
            </h4>
            <div className="row" style={{ gap: ".6rem" }}>
              <select
                className="select"
                style={{ width: "auto" }}
                value={order.paymentStatus}
                onChange={(e) => handlePaymentChange(e.target.value)}
                disabled={updating}
              >
                <option value="paid">Payment: Paid</option>
                <option value="partial">Payment: Partial</option>
                <option value="unpaid">Payment: Unpaid</option>
              </select>
            </div>
            {order.notes && (
              <p className="muted" style={{ margin: ".4rem 0 0", fontSize: ".88rem" }}>
                <FiFileText size={13} style={{ verticalAlign: "-2px" }} /> {order.notes}
              </p>
            )}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: ".8rem" }}>Ordered Items</h4>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="num">Qty Sold</th>
                  <th className="num">Unit Price</th>
                  <th className="num">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td className="muted">{item.product?.sku || "—"}</td>
                    <td className="num">{item.quantity}</td>
                    <td className="num">{formatINR(item.unitPrice)}</td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {formatINR(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="spread" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
          <span className="muted">Total Order Value</span>
          <h2 className="grad-text" style={{ margin: 0 }}>
            {formatINR(order.totalAmount)}
          </h2>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        danger
        title="Delete sales order?"
        message={`Order “${order.orderNumber}” will be removed. If this order was completed, the product stock quantities will be restored back to inventory.`}
        confirmLabel="Delete order"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setShowDelete(false)}
      />
    </div>
  );
}
