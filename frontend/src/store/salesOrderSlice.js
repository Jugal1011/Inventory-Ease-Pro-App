import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { SalesOrdersAPI } from "../api";
import { fetchProducts } from "./productSlice";

export const fetchSalesOrders = createAsyncThunk("salesOrders/list", () => SalesOrdersAPI.list());
export const fetchSalesOrder = createAsyncThunk("salesOrders/get", (id) => SalesOrdersAPI.get(id));
export const createSalesOrder = createAsyncThunk("salesOrders/create", async (data, { dispatch }) => {
  const result = await SalesOrdersAPI.create(data);
  // Real-time sync: refresh inventory stock
  dispatch(fetchProducts());
  return result;
});
export const updateSalesOrderStatus = createAsyncThunk(
  "salesOrders/updateStatus",
  async ({ id, data }, { dispatch }) => {
    const result = await SalesOrdersAPI.updateStatus(id, data);
    dispatch(fetchProducts());
    return result;
  }
);
export const deleteSalesOrder = createAsyncThunk("salesOrders/delete", async (id, { dispatch }) => {
  await SalesOrdersAPI.remove(id);
  dispatch(fetchProducts());
  return id;
});

const salesOrderSlice = createSlice({
  name: "salesOrders",
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
      .addCase(fetchSalesOrders.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchSalesOrders.fulfilled, (state, { payload }) => {
        state.listLoading = false;
        state.items = payload;
      })
      .addCase(fetchSalesOrders.rejected, (state) => {
        state.listLoading = false;
      })
      .addCase(fetchSalesOrder.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchSalesOrder.fulfilled, (state, { payload }) => {
        state.currentLoading = false;
        state.current = payload;
      })
      .addCase(fetchSalesOrder.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createSalesOrder.pending, (state) => {
        state.saving = true;
      })
      .addCase(createSalesOrder.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.items.unshift(payload);
      })
      .addCase(createSalesOrder.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateSalesOrderStatus.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateSalesOrderStatus.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.current = payload;
        const index = state.items.findIndex((o) => o._id === payload._id);
        if (index !== -1) state.items[index] = payload;
      })
      .addCase(updateSalesOrderStatus.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deleteSalesOrder.fulfilled, (state, { payload: id }) => {
        state.items = state.items.filter((o) => o._id !== id);
      });
  },
});

export default salesOrderSlice.reducer;
export const selectSalesOrders = (state) => state.salesOrders;

export const selectSalesStats = createSelector([(state) => state.salesOrders.items], (items) => ({
  total: items.length,
  revenue: items
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  completed: items.filter((o) => o.status === "completed").length,
  pending: items.filter((o) => o.status === "pending").length,
  cancelled: items.filter((o) => o.status === "cancelled").length,
}));
