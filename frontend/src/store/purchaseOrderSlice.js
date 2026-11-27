import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { PurchaseOrdersAPI } from "../api";
import { fetchProducts } from "./productSlice";

export const fetchPurchaseOrders = createAsyncThunk("purchaseOrders/list", () => PurchaseOrdersAPI.list());
export const fetchPurchaseOrder = createAsyncThunk("purchaseOrders/get", (id) => PurchaseOrdersAPI.get(id));
export const createPurchaseOrder = createAsyncThunk("purchaseOrders/create", async (data, { dispatch }) => {
  const result = await PurchaseOrdersAPI.create(data);
  // Real-time sync: refresh inventory stock
  dispatch(fetchProducts());
  return result;
});
export const updatePurchaseOrderStatus = createAsyncThunk(
  "purchaseOrders/updateStatus",
  async ({ id, data }, { dispatch }) => {
    const result = await PurchaseOrdersAPI.updateStatus(id, data);
    dispatch(fetchProducts());
    return result;
  }
);
export const deletePurchaseOrder = createAsyncThunk("purchaseOrders/delete", async (id, { dispatch }) => {
  await PurchaseOrdersAPI.remove(id);
  dispatch(fetchProducts());
  return id;
});

const purchaseOrderSlice = createSlice({
  name: "purchaseOrders",
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
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, { payload }) => {
        state.listLoading = false;
        state.items = payload;
      })
      .addCase(fetchPurchaseOrders.rejected, (state) => {
        state.listLoading = false;
      })
      .addCase(fetchPurchaseOrder.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchPurchaseOrder.fulfilled, (state, { payload }) => {
        state.currentLoading = false;
        state.current = payload;
      })
      .addCase(fetchPurchaseOrder.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createPurchaseOrder.pending, (state) => {
        state.saving = true;
      })
      .addCase(createPurchaseOrder.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.items.unshift(payload);
      })
      .addCase(createPurchaseOrder.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updatePurchaseOrderStatus.pending, (state) => {
        state.saving = true;
      })
      .addCase(updatePurchaseOrderStatus.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.current = payload;
        const index = state.items.findIndex((o) => o._id === payload._id);
        if (index !== -1) state.items[index] = payload;
      })
      .addCase(updatePurchaseOrderStatus.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deletePurchaseOrder.fulfilled, (state, { payload: id }) => {
        state.items = state.items.filter((o) => o._id !== id);
      });
  },
});

export default purchaseOrderSlice.reducer;
export const selectPurchaseOrders = (state) => state.purchaseOrders;

export const selectPurchaseStats = createSelector([(state) => state.purchaseOrders.items], (items) => ({
  total: items.length,
  spend: items
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  received: items.filter((o) => o.status === "received").length,
  pending: items.filter((o) => o.status === "pending").length,
  cancelled: items.filter((o) => o.status === "cancelled").length,
}));
