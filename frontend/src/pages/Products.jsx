import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiBox,
  FiAlertCircle,
  FiDollarSign,
  FiLayers,
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiFilter,
} from "react-icons/fi";
import {
  fetchProducts,
  deleteProduct,
  selectProducts,
  selectProductStats,
} from "../store/productSlice";
import { StatCard, ConfirmDialog, PageHeader, EmptyState, Spinner } from "../components/ui";
import { formatINR, formatNumber, shorten, stockStatus } from "../utils";
import { errorMessage } from "../api";

const PAGE_SIZE = 8;

export default function Products() {
  const dispatch = useDispatch();
  const { items, listLoading } = useSelector(selectProducts);
  const stats = useSelector(selectProductStats);

  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts())
      .unwrap()
      .catch((err) => toast.error(errorMessage(err)));
  }, [dispatch]);

  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category).filter(Boolean));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;

    // Filter by stock status
    if (stockFilter === "in_stock") {
      result = result.filter((p) => p.quantity > 5);
    } else if (stockFilter === "low_stock") {
      result = result.filter((p) => p.quantity > 0 && p.quantity <= 5);
    } else if (stockFilter === "out_of_stock") {
      result = result.filter((p) => p.quantity === 0);
    }

    // Filter by category
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Filter by query (name, category, SKU)
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, stockFilter, categoryFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const onQuery = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  const onStockFilter = (status) => {
    setStockFilter(status);
    setPage(1);
  };

  const onCategoryFilter = (cat) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await dispatch(deleteProduct(target._id)).unwrap();
      toast.success("Product deleted successfully");
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
        title="Products & Inventory"
        subtitle="Manage stock levels, product catalog, pricing, and assets."
        actions={
          <Link className="btn btn-primary" to="/app/add-product">
            <FiPlus /> Add product
          </Link>
        }
      />

      <div className="grid grid-4">
        <StatCard
          icon={<FiBox size={20} />}
          label="Total products"
          value={formatNumber(stats.totalProducts)}
          accent="indigo"
          delay={0}
        />
        <StatCard
          icon={<FiDollarSign size={20} />}
          label="Inventory value"
          value={formatINR(stats.totalValue)}
          accent="emerald"
          delay={0.08}
        />
        <StatCard
          icon={<FiAlertCircle size={20} />}
          label="Out of stock"
          value={formatNumber(stats.outOfStock)}
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

      {stats.lowStock > 0 && (
        <div
          className="glass rise"
          style={{
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: ".8rem",
            borderColor: "rgba(251,191,36,.35)",
          }}
        >
          <FiAlertCircle color="#fbbf24" size={20} />
          <span>
            <b style={{ color: "var(--text)" }}>{stats.lowStock}</b>{" "}
            {stats.lowStock === 1 ? "product has" : "products have"} low stock (5 or fewer units remaining).
          </span>
        </div>
      )}

      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        <div className="toolbar">
          <div>
            <h3 className="panel-title">Product Catalog</h3>
            <span className="muted">
              {filtered.length} of {items.length} products shown
            </span>
          </div>

          <div className="row" style={{ gap: ".8rem" }}>
            <div className="row" style={{ gap: ".35rem" }}>
              {[
                { id: "all", label: "All" },
                { id: "in_stock", label: "In Stock" },
                { id: "low_stock", label: "Low Stock" },
                { id: "out_of_stock", label: "Out of Stock" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`btn btn-sm ${stockFilter === tab.id ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "0.35rem 0.75rem" }}
                  onClick={() => onStockFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {categories.length > 1 && (
              <select
                className="select"
                style={{ width: "auto", padding: "0.4rem 0.8rem", fontSize: ".85rem" }}
                value={categoryFilter}
                onChange={(e) => onCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            <div className="search">
              <FiSearch size={16} />
              <input
                className="input"
                placeholder="Search name, category or SKU"
                value={query}
                onChange={onQuery}
                aria-label="Search products"
              />
            </div>
          </div>
        </div>

        {listLoading && items.length === 0 ? (
          <Spinner label="Loading product catalog…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FiBox size={26} />}
            title="No products yet"
            action={
              <Link className="btn btn-primary" to="/app/add-product">
                Add your first product
              </Link>
            }
          >
            Start building your inventory catalog. Track real-time stock levels, pricing, sales, and restocking.
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FiSearch size={26} />} title="No matching products">
            No products match your current filters. Try searching with a different term or resetting filters.
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none", borderRadius: 0, background: "transparent" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="num">Price</th>
                    <th className="num">Stock Qty</th>
                    <th className="num">Total Value</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => {
                    const status = stockStatus(p.quantity);
                    const serial = (current - 1) * PAGE_SIZE + i + 1;
                    return (
                      <tr key={p._id}>
                        <td className="muted">{serial}</td>
                        <td>
                          <div className="product-cell">
                            <div className="thumb">
                              {p.image?.url ? (
                                <img src={p.image.url} alt="" loading="lazy" />
                              ) : (
                                <FiPackage size={16} />
                              )}
                            </div>
                            <div>
                              <Link
                                to={`/app/product-detail/${p._id}`}
                                style={{ fontWeight: 600, color: "var(--text)" }}
                                title={p.name}
                              >
                                {shorten(p.name, 24)}
                              </Link>
                              <div className="muted" style={{ fontSize: ".78rem" }}>
                                {p.sku}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="chip">{p.category}</span>
                        </td>
                        <td className="num">{formatINR(p.price)}</td>
                        <td className="num">{formatNumber(p.quantity)}</td>
                        <td className="num" style={{ fontWeight: 600 }}>
                          {formatINR(p.price * p.quantity)}
                        </td>
                        <td>
                          <span className={`badge badge-${status.tone}`}>{status.label}</span>
                        </td>
                        <td>
                          <div className="actions">
                            <Link
                              className="icon-btn view"
                              to={`/app/product-detail/${p._id}`}
                              aria-label="View product"
                              title="View details"
                            >
                              <FiEye size={16} />
                            </Link>
                            <Link
                              className="icon-btn edit"
                              to={`/app/edit-product/${p._id}`}
                              aria-label="Edit product"
                              title="Edit product"
                            >
                              <FiEdit2 size={16} />
                            </Link>
                            <button
                              type="button"
                              className="icon-btn delete"
                              aria-label="Delete product"
                              title="Delete product"
                              onClick={() => setTarget(p)}
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
        title="Delete product?"
        message={
          target
            ? `“${target.name}” and its associated photo will be permanently deleted. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete product"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setTarget(null)}
      />
    </div>
  );
}
