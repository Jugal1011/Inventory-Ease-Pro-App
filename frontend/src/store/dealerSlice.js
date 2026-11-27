import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { DealersAPI } from "../api";

export const fetchDealers = createAsyncThunk("dealers/list", () => DealersAPI.list());
export const fetchDealer = createAsyncThunk("dealers/get", (id) => DealersAPI.get(id));
export const createDealer = createAsyncThunk("dealers/create", (data) => DealersAPI.create(data));
export const updateDealer = createAsyncThunk("dealers/update", ({ id, data }) => DealersAPI.update(id, data));
export const deleteDealer = createAsyncThunk("dealers/delete", async (id) => {
  await DealersAPI.remove(id);
  return id;
});

const dealerSlice = createSlice({
  name: "dealers",
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
      .addCase(fetchDealers.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchDealers.fulfilled, (state, { payload }) => {
        state.listLoading = false;
        state.items = payload;
      })
      .addCase(fetchDealers.rejected, (state) => {
        state.listLoading = false;
      })
      .addCase(fetchDealer.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchDealer.fulfilled, (state, { payload }) => {
        state.currentLoading = false;
        state.current = payload;
      })
      .addCase(fetchDealer.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createDealer.pending, (state) => {
        state.saving = true;
      })
      .addCase(createDealer.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.items.unshift(payload);
      })
      .addCase(createDealer.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateDealer.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateDealer.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.current = payload;
        const index = state.items.findIndex((d) => d._id === payload._id);
        if (index !== -1) state.items[index] = payload;
      })
      .addCase(updateDealer.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deleteDealer.fulfilled, (state, { payload: id }) => {
        state.items = state.items.filter((d) => d._id !== id);
      });
  },
});

export default dealerSlice.reducer;
export const selectDealers = (state) => state.dealers;

export const selectDealerStats = createSelector([(state) => state.dealers.items], (items) => ({
  total: items.length,
  active: items.filter((d) => d.status === "active").length,
  inactive: items.filter((d) => d.status === "inactive").length,
  categories: new Set(items.map((d) => d.category || "General")).size,
}));
