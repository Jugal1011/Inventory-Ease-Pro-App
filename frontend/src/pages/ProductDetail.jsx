import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiEdit2, FiPackage, FiTag, FiCalendar, FiClock } from "react-icons/fi";
import { fetchProduct, selectProducts } from "../store/productSlice";
import { FullScreenLoader, EmptyState } from "../components/ui";
import { formatINR, formatNumber, formatDate, stockStatus } from "../utils";
import { errorMessage } from "../api";

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: product, currentLoading } = useSelector(selectProducts);

  useEffect(() => {
    dispatch(fetchProduct(id)).unwrap().catch((err) => toast.error(errorMessage(err)));
  }, [id, dispatch]);

  if (currentLoading && (!product || product._id !== id)) return <FullScreenLoader />;
  if (!product || product._id !== id) {
    return (
      <div className="glass">
        <EmptyState icon={<FiPackage size={26} />} title="Product not found" action={<Link className="btn" to="/app/dashboard">Back to dashboard</Link>}>
          It may have been removed, or you don't have access to it.
        </EmptyState>
      </div>
    );
  }

  const status = stockStatus(product.quantity);
  const total = product.price * product.quantity;

  return (
    <div className="stack" style={{ gap: "1.4rem" }}>
      <div className="spread">
        <Link className="btn btn-ghost" to="/app/dashboard"><FiArrowLeft /> Back to inventory</Link>
        <Link className="btn btn-primary" to={`/app/edit-product/${product._id}`}><FiEdit2 /> Edit product</Link>
      </div>

      <div className="detail-grid">
        <div className="glass stack" style={{ gap: "1rem" }}>
          <div className="detail-media">
            {product.image?.url ? <img src={product.image.url} alt={product.name} /> : <FiPackage size={48} />}
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className={`badge badge-${status.tone}`}>{status.label}</span>
            <span className="chip"><FiTag size={12} style={{ verticalAlign: "-2px" }} /> {product.category}</span>
          </div>
        </div>

        <div className="glass">
          <span className="eyebrow">{product.sku}</span>
          <h2 className="mt-2" style={{ marginBottom: ".4rem" }}>{product.name}</h2>
          <p className="muted" style={{ fontSize: ".85rem" }}>Product ID · {product._id}</p>

          <div className="kv">
            <div><small>Price</small><b>{formatINR(product.price)}</b></div>
            <div><small>In stock</small><b>{formatNumber(product.quantity)} units</b></div>
            <div><small>Total value</small><b className="grad-text">{formatINR(total)}</b></div>
            <div><small>Status</small><b style={{ fontSize: ".95rem" }}>{status.label}</b></div>
          </div>

          <h4 style={{ fontSize: "1rem", color: "var(--text)" }}>Description</h4>
          <div className="description">{product.description}</div>

          <div className="stack mt-2" style={{ gap: ".5rem", fontSize: ".88rem" }}>
            <span className="muted"><FiCalendar size={14} style={{ verticalAlign: "-2px" }} /> Created {formatDate(product.createdAt)}</span>
            <span className="muted"><FiClock size={14} style={{ verticalAlign: "-2px" }} /> Last updated {formatDate(product.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
