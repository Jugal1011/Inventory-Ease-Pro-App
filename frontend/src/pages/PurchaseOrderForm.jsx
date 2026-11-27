import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiTruck,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiCheck,
} from "react-icons/fi";
import { createPurchaseOrder } from "../store/purchaseOrderSlice";
import { fetchProducts, selectProducts } from "../store/productSlice";
import { fetchDealers, selectDealers } from "../store/dealerSlice";
import { PageHeader, Field, FullScreenLoader } from "../components/ui";
import { formatINR, formatNumber } from "../utils";
import { errorMessage } from "../api";

export default function PurchaseOrderForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: products, listLoading: productsLoading } = useSelector(selectProducts);
  const { items: dealers, listLoading: dealersLoading } = useSelector(selectDealers);

  const [dealer, setDealer] = useState("");
  const [status, setStatus] = useState("received");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([
    { product: "", quantity: 10, unitPrice: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchDealers());
  }, [dispatch]);

  const onDealerChange = (e) => setDealer(e.target.value);

  const onProductChange = (index, productId) => {
    const selectedProd = products.find((p) => p._id === productId);
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      product: productId,
      unitPrice: selectedProd ? selectedProd.price : 0,
    };
    setLines(updated);
  };

  const onLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { product: "", quantity: 10, unitPrice: 0 }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return toast.error("Order must contain at least one item");
    setLines(lines.filter((_, i) => i !== index));
  };

  const totalAmount = lines.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const submit = async (e) => {
    e.preventDefault();
    setAttempted(true);

    if (!dealer) return toast.error("Please select a dealer / supplier");
    if (lines.length === 0) return toast.error("Please add at least one line item");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.product) return toast.error(`Item #${i + 1}: Please select a product`);
      const qty = Number(line.quantity);
      if (isNaN(qty) || qty <= 0) return toast.error(`Item #${i + 1}: Quantity must be 1 or more`);
    }

    const payload = {
      dealer,
      status,
      paymentStatus,
      notes: notes.trim(),
      items: lines.map((l) => ({
        product: l.product,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    };

    setSaving(true);
    try {
      await dispatch(createPurchaseOrder(payload)).unwrap();
      toast.success("Purchase order created & inventory restocked in real time!");
      navigate("/app/purchase-orders");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (productsLoading || dealersLoading) return <FullScreenLoader />;

  return (
    <div className="stack" style={{ gap: "1.4rem", maxWidth: 960 }}>
      <PageHeader
        title="Create Purchase Order"
        subtitle="Purchase stock from suppliers and restock inventory in real time."
        actions={
          <Link className="btn btn-ghost" to="/app/purchase-orders">
            <FiArrowLeft /> Back to purchase orders
          </Link>
        }
      />

      <form onSubmit={submit} className="glass stack" style={{ gap: "1.6rem" }}>
        <div className="form-grid">
          <Field
            label="Dealer / Supplier *"
            hint={
              dealers.length === 0 ? (
                <span>
                  No dealers found. <Link to="/app/add-dealer" style={{ color: "var(--indigo)" }}>Add a dealer first</Link>.
                </span>
              ) : attempted && !dealer ? (
                "Please select a dealer"
              ) : undefined
            }
          >
            <div className="input-with-icon">
              <FiTruck />
              <select className="select" value={dealer} onChange={onDealerChange}>
                <option value="">-- Choose supplier / dealer --</option>
                {dealers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} {d.company ? `(${d.company})` : ""} - {d.category}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="Order status">
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="received">Received (Restock inventory immediately)</option>
              <option value="pending">Pending (Awaiting delivery)</option>
            </select>
          </Field>

          <Field label="Payment status">
            <select className="select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="paid">Paid</option>
              <option value="partial">Partial Payment</option>
              <option value="unpaid">Unpaid / Credit</option>
            </select>
          </Field>

          <Field label="Purchase Notes" hint="Optional supplier invoice # or remarks">
            <input
              className="input"
              placeholder="e.g. Supplier Invoice #INV-8891"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>

        <div>
          <div className="spread" style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Products to Restock</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
              <FiPlus /> Add line item
            </button>
          </div>

          <div className="stack" style={{ gap: ".8rem" }}>
            {lines.map((item, index) => {
              const selectedProduct = products.find((p) => p._id === item.product);

              return (
                <div
                  key={index}
                  className="glass rise"
                  style={{
                    padding: "1rem",
                    display: "grid",
                    gridTemplateColumns: "1.5fr 110px 140px 140px 42px",
                    gap: ".8rem",
                    alignItems: "center",
                  }}
                >
                  <Field label={index === 0 ? "Product" : undefined}>
                    <select
                      className="select"
                      value={item.product}
                      onChange={(e) => onProductChange(index, e.target.value)}
                    >
                      <option value="">-- Choose product --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Current: {p.quantity} units)
                        </option>
                      ))}
                    </select>
                    {selectedProduct && (
                      <span className="hint">
                        Current inventory: <b>{formatNumber(selectedProduct.quantity)}</b> units
                      </span>
                    )}
                  </Field>

                  <Field label={index === 0 ? "Quantity" : undefined}>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={item.quantity}
                      onChange={(e) => onLineChange(index, "quantity", e.target.value)}
                    />
                  </Field>

                  <Field label={index === 0 ? "Unit Cost" : undefined}>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={item.unitPrice}
                      onChange={(e) => onLineChange(index, "unitPrice", e.target.value)}
                    />
                  </Field>

                  <Field label={index === 0 ? "Line Total" : undefined}>
                    <div
                      style={{
                        padding: ".8rem .6rem",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        textAlign: "right",
                      }}
                    >
                      {formatINR((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                    </div>
                  </Field>

                  <div style={{ paddingTop: index === 0 ? "1.4rem" : 0 }}>
                    <button
                      type="button"
                      className="icon-btn delete"
                      onClick={() => removeLine(index)}
                      title="Remove item"
                      disabled={lines.length === 1}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="spread"
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "1.2rem",
            alignItems: "center",
          }}
        >
          <div>
            <span className="muted">Total Purchase Spend</span>
            <h2 className="grad-text" style={{ margin: ".2rem 0 0" }}>
              {formatINR(totalAmount)}
            </h2>
          </div>

          <div className="row" style={{ gap: ".8rem" }}>
            <Link className="btn btn-ghost" to="/app/purchase-orders">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <FiCheck /> {saving ? "Processing…" : "Create PO & Restock Inventory"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
