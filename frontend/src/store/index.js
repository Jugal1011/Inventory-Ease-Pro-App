import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import productReducer from "./productSlice";
import customerReducer from "./customerSlice";
import dealerReducer from "./dealerSlice";
import salesOrderReducer from "./salesOrderSlice";
import purchaseOrderReducer from "./purchaseOrderSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    customers: customerReducer,
    dealers: dealerReducer,
    salesOrders: salesOrderReducer,
    purchaseOrders: purchaseOrderReducer,
  },
});
