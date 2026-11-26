import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiEye, FiEdit2, FiTrash2, FiSearch, FiBox, FiChevronLeft, FiChevronRight, FiPackage } from "react-icons/fi";
import { formatINR, formatNumber, shorten, stockStatus } from "../utils";
import { EmptyState, Spinner } from "./ui";

const PAGE_SIZE = 8;

export default function ProductTable({ products, loading, onDelete }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const onQuery = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
      <div className="toolbar">
        <div>
          <h3 className="panel-title">Inventory items</h3>
          <span className="muted">{filtered.length} of {products.length} shown</span>
        </div>
        <div className="search">
          <FiSearch size={16} />
          <input className="input" placeholder="Search name, category or SKU" value={query} onChange={onQuery} aria-label="Search products" />
        </div>
      </div>

      {loading && products.length === 0 ? (
        <Spinner label="Fetching your inventory…" />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<FiBox size={26} />}
          title="No products yet"
          action={<Link className="btn btn-primary" to="/app/add-product">Add your first product</Link>}
        >
          Start building your catalogue. Stock levels, values and alerts appear here as soon as you add items.
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FiSearch size={26} />} title="No matches">
          Nothing matches “{query}”. Try a different name, category or SKU.
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
                  <th className="num">Qty</th>
                  <th className="num">Value</th>
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
                            {p.image?.url ? <img src={p.image.url} alt="" loading="lazy" /> : <FiPackage size={16} />}
                          </div>
                          <div>
                            <Link to={`/app/product-detail/${p._id}`} style={{ fontWeight: 600 }} title={p.name}>
                              {shorten(p.name, 22)}
                            </Link>
                            <div className="muted" style={{ fontSize: ".78rem" }}>{p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="chip">{p.category}</span></td>
                      <td className="num">{formatINR(p.price)}</td>
                      <td className="num">{formatNumber(p.quantity)}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{formatINR(p.price * p.quantity)}</td>
                      <td><span className={`badge badge-${status.tone}`}>{status.label}</span></td>
                      <td>
                        <div className="actions">
                          <Link className="icon-btn view" to={`/app/product-detail/${p._id}`} aria-label="View product"><FiEye size={16} /></Link>
                          <Link className="icon-btn edit" to={`/app/edit-product/${p._id}`} aria-label="Edit product"><FiEdit2 size={16} /></Link>
                          <button className="icon-btn delete" onClick={() => onDelete(p)} aria-label="Delete product"><FiTrash2 size={16} /></button>
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
              <button className="btn btn-sm btn-ghost" onClick={() => setPage(current - 1)} disabled={current === 1}>
                <FiChevronLeft /> Prev
              </button>
              <div className="pages">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={`page-btn ${n === current ? "active" : ""}`} onClick={() => setPage(n)} aria-current={n === current}>
                    {n}
                  </button>
                ))}
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => setPage(current + 1)} disabled={current === pageCount}>
                Next <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
