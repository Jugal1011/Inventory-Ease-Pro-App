import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { ProductsAPI } from "../api";

export const fetchProducts = createAsyncThunk("products/list", () => ProductsAPI.list());
export const fetchProduct = createAsyncThunk("products/get", (id) => ProductsAPI.get(id));
export const createProduct = createAsyncThunk("products/create", (form) => ProductsAPI.create(form));
export const updateProduct = createAsyncThunk("products/update", ({ id, form }) => ProductsAPI.update(id, form));
export const deleteProduct = createAsyncThunk("products/delete", async (id) => {
  await ProductsAPI.remove(id);
  return id;
});

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    listLoading: false,
    current: null,
    currentLoading: false,
    saving: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => {
        state.listLoading = false;
        state.items = payload;
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.listLoading = false;
      })
      .addCase(fetchProduct.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchProduct.fulfilled, (state, { payload }) => {
        state.currentLoading = false;
        state.current = payload;
      })
      .addCase(fetchProduct.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createProduct.pending, (state) => {
        state.saving = true;
      })
      .addCase(createProduct.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.items.unshift(payload);
      })
      .addCase(createProduct.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateProduct.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.current = payload;
        const index = state.items.findIndex((p) => p._id === payload._id);
        if (index !== -1) state.items[index] = payload;
      })
      .addCase(updateProduct.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deleteProduct.fulfilled, (state, { payload: id }) => {
        state.items = state.items.filter((p) => p._id !== id);
      });
  },
});

export default productSlice.reducer;
export const selectProducts = (state) => state.products;

// Derived stats are memoized and only recomputed when the product list changes.
export const selectProductStats = createSelector([(state) => state.products.items], (items) => ({
  totalProducts: items.length,
  totalValue: items.reduce((sum, p) => sum + p.price * p.quantity, 0),
  outOfStock: items.filter((p) => p.quantity === 0).length,
  lowStock: items.filter((p) => p.quantity > 0 && p.quantity <= 5).length,
  categories: new Set(items.map((p) => p.category)).size,
}));
