import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiUploadCloud, FiImage } from "react-icons/fi";
import { createProduct, updateProduct, fetchProduct, selectProducts } from "../store/productSlice";
import { PageHeader, Field, FullScreenLoader } from "../components/ui";
import { errorMessage } from "../api";

const EMPTY = { name: "", category: "", quantity: "", price: "", description: "" };
const MAX_IMAGE_MB = 5;

export default function ProductForm({ mode }) {
  const isEdit = mode === "edit";
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, currentLoading, saving } = useSelector(selectProducts);

  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loaded, setLoaded] = useState(!isEdit);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    dispatch(fetchProduct(id))
      .unwrap()
      .then(() => setLoaded(true))
      .catch((err) => toast.error(errorMessage(err)));
  }, [isEdit, id, dispatch]);

  // Prefill the form once the product arrives.
  useEffect(() => {
    if (!isEdit || !current || current._id !== id) return;
    setForm({
      name: current.name,
      category: current.category,
      quantity: String(current.quantity),
      price: String(current.price),
      description: current.description,
    });
    setPreview(current.image?.url || "");
  }, [isEdit, current, id]);

  // Revoke object URLs to avoid leaking memory.
  useEffect(() => () => preview.startsWith("blob:") && URL.revokeObjectURL(preview), [preview]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onFile = (e) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(chosen.type)) return toast.error("Use a jpg, jpeg, png or webp image");
    if (chosen.size > MAX_IMAGE_MB * 1024 * 1024) return toast.error(`Image must be ${MAX_IMAGE_MB}MB or smaller`);
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  };

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.category.trim()) e.category = "Category is required";
    if (form.quantity === "" || Number(form.quantity) < 0 || !Number.isInteger(Number(form.quantity))) e.quantity = "Enter a whole number, 0 or more";
    if (form.price === "" || Number(form.price) < 0) e.price = "Enter a price, 0 or more";
    if (!form.description.trim()) e.description = "Description is required";
    return e;
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    setAttempted(true);
    if (Object.keys(errors).length) return toast.error(Object.values(errors)[0]);

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, typeof value === "string" ? value.trim() : value));
    if (file) data.append("image", file);

    try {
      if (isEdit) {
        await dispatch(updateProduct({ id, form: data })).unwrap();
        toast.success("Product updated");
      } else {
        await dispatch(createProduct(data)).unwrap();
        toast.success("Product added");
      }
      navigate("/app/dashboard");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (isEdit && (!loaded || currentLoading)) return <FullScreenLoader />;

  const title = isEdit ? "Edit product" : "Add a product";
  const subtitle = isEdit ? "Update details, stock or photo." : "Add an item to your catalogue.";

  return (
    <div className="stack" style={{ gap: "1.4rem", maxWidth: 980 }}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<Link className="btn btn-ghost" to="/app/dashboard"><FiArrowLeft /> Back</Link>}
      />

      <form onSubmit={submit} className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.5fr)", alignItems: "start" }} noValidate>
        <div className="glass stack" style={{ gap: "1rem" }}>
          <h3 style={{ margin: 0 }}>Product image</h3>
          <label className="upload-zone" htmlFor="image">
            {preview ? (
              <img className="upload-preview" src={preview} alt="Selected product preview" style={{ width: "100%" }} />
            ) : (
              <>
                <span className="stat-icon accent-indigo"><FiImage size={20} /></span>
                <span>
                  <b style={{ display: "block" }}>Click to upload</b>
                  <span className="muted">JPG, PNG or WEBP · up to {MAX_IMAGE_MB}MB</span>
                </span>
              </>
            )}
            <input id="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
          </label>
          {preview && (
            <label className="btn btn-sm" htmlFor="image" style={{ alignSelf: "flex-start" }}>
              <FiUploadCloud /> Replace image
            </label>
          )}
        </div>

        <div className="glass">
          <div className="form-grid">
            <Field label="Product name" className="span-2">
              <input className="input" name="name" value={form.name} onChange={onChange} placeholder="e.g. Wireless keyboard" />
              {attempted && errors.name && <span className="hint" style={{ color: "#fda4af" }}>{errors.name}</span>}
            </Field>
            <Field label="Category">
              <input className="input" name="category" value={form.category} onChange={onChange} placeholder="Electronics" />
            </Field>
            <Field label="Price (₹)">
              <input className="input" type="number" min="0" step="0.01" name="price" value={form.price} onChange={onChange} placeholder="0" />
            </Field>
            <Field label="Quantity in stock">
              <input className="input" type="number" min="0" step="1" name="quantity" value={form.quantity} onChange={onChange} placeholder="0" />
            </Field>
            <Field label="Stock value" hint="Calculated automatically">
              <input className="input" value={form.price && form.quantity ? `₹${(Number(form.price) * Number(form.quantity)).toLocaleString("en-IN")}` : "—"} readOnly disabled />
            </Field>
            <Field label="Description" className="span-2">
              <textarea className="textarea" name="description" value={form.description} onChange={onChange} placeholder="Key details, specs, supplier notes…" maxLength={2000} />
              <span className="hint">{form.description.length}/2000</span>
            </Field>
          </div>

          <div className="row mt-2" style={{ justifyContent: "flex-end" }}>
            <Link className="btn btn-ghost" to="/app/dashboard">Cancel</Link>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <FiSave /> {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
