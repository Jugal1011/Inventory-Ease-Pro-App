import { createAsyncThunk, createSlice, createSelector } from "@reduxjs/toolkit";
import { CustomersAPI } from "../api";

export const fetchCustomers = createAsyncThunk("customers/list", () => CustomersAPI.list());
export const fetchCustomer = createAsyncThunk("customers/get", (id) => CustomersAPI.get(id));
export const createCustomer = createAsyncThunk("customers/create", (data) => CustomersAPI.create(data));
export const updateCustomer = createAsyncThunk("customers/update", ({ id, data }) => CustomersAPI.update(id, data));
export const deleteCustomer = createAsyncThunk("customers/delete", async (id) => {
  await CustomersAPI.remove(id);
  return id;
});

const customerSlice = createSlice({
  name: "customers",
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
      .addCase(fetchCustomers.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, { payload }) => {
        state.listLoading = false;
        state.items = payload;
      })
      .addCase(fetchCustomers.rejected, (state) => {
        state.listLoading = false;
      })
      .addCase(fetchCustomer.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchCustomer.fulfilled, (state, { payload }) => {
        state.currentLoading = false;
        state.current = payload;
      })
      .addCase(fetchCustomer.rejected, (state) => {
        state.currentLoading = false;
      })
      .addCase(createCustomer.pending, (state) => {
        state.saving = true;
      })
      .addCase(createCustomer.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.items.unshift(payload);
      })
      .addCase(createCustomer.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateCustomer.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateCustomer.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.current = payload;
        const index = state.items.findIndex((c) => c._id === payload._id);
        if (index !== -1) state.items[index] = payload;
      })
      .addCase(updateCustomer.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deleteCustomer.fulfilled, (state, { payload: id }) => {
        state.items = state.items.filter((c) => c._id !== id);
      });
  },
});

export default customerSlice.reducer;
export const selectCustomers = (state) => state.customers;

export const selectCustomerStats = createSelector([(state) => state.customers.items], (items) => ({
  total: items.length,
  active: items.filter((c) => c.status === "active").length,
  lead: items.filter((c) => c.status === "lead").length,
  inactive: items.filter((c) => c.status === "inactive").length,
}));
