import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiBox, FiAlertCircle, FiDollarSign, FiLayers, FiPlus } from "react-icons/fi";
import { fetchProducts, deleteProduct, selectProducts, selectProductStats } from "../store/productSlice";
import { StatCard, ConfirmDialog, PageHeader } from "../components/ui";
import ProductTable from "../components/ProductTable";
import { formatINR, formatNumber } from "../utils";
import { errorMessage } from "../api";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { items, listLoading } = useSelector(selectProducts);
  const stats = useSelector(selectProductStats);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts()).unwrap().catch((err) => toast.error(errorMessage(err)));
  }, [dispatch]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteProduct(target._id)).unwrap();
      toast.success("Product deleted");
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
        title="Inventory overview"
        subtitle="A live snapshot of your stock, value and alerts."
        actions={
          <Link className="btn btn-primary" to="/app/add-product">
            <FiPlus /> Add product
          </Link>
        }
      />

      <div className="grid grid-4">
        <StatCard icon={<FiBox size={20} />} label="Total products" value={formatNumber(stats.totalProducts)} accent="indigo" delay={0} />
        <StatCard icon={<FiDollarSign size={20} />} label="Stock value" value={formatINR(stats.totalValue)} accent="emerald" delay={0.08} />
        <StatCard icon={<FiAlertCircle size={20} />} label="Out of stock" value={formatNumber(stats.outOfStock)} accent="rose" delay={0.16} />
        <StatCard icon={<FiLayers size={20} />} label="Categories" value={formatNumber(stats.categories)} accent="cyan" delay={0.24} />
      </div>

      {stats.lowStock > 0 && (
        <div className="glass rise" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: ".8rem", borderColor: "rgba(251,191,36,.35)" }}>
          <FiAlertCircle color="#fbbf24" size={20} />
          <span>
            <b style={{ color: "var(--text)" }}>{stats.lowStock}</b> {stats.lowStock === 1 ? "item is" : "items are"} running low (5 or fewer units).
          </span>
        </div>
      )}

      <ProductTable products={items} loading={listLoading} onDelete={setTarget} />

      <ConfirmDialog
        open={!!target}
        danger
        title="Delete product?"
        message={target ? `“${target.name}” and its image will be permanently removed. This can't be undone.` : ""}
        confirmLabel="Delete product"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setTarget(null)}
      />
    </div>
  );
}
