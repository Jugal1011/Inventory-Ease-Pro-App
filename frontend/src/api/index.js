import axios from "axios";

// Empty base URL in dev (Vite proxy). Set VITE_API_URL for a separate API host.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

export const errorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";

export const UsersAPI = {
  register: (data) => api.post("/api/users/register", data).then((r) => r.data),
  login: (data) => api.post("/api/users/login", data).then((r) => r.data),
  logout: () => api.get("/api/users/logout").then((r) => r.data),
  status: () => api.get("/api/users/loggedin").then((r) => r.data),
  me: () => api.get("/api/users/getuser").then((r) => r.data),
  update: (form) => api.patch("/api/users/updateuser", form).then((r) => r.data),
  changePassword: (data) => api.patch("/api/users/changepassword", data).then((r) => r.data),
  forgot: (email) => api.post("/api/users/forgotpassword", { email }).then((r) => r.data),
  reset: (token, data) => api.put(`/api/users/resetpassword/${token}`, data).then((r) => r.data),
  confirm: (token) => api.put(`/api/users/confirmEmail/${token}`).then((r) => r.data),
};

export const ProductsAPI = {
  list: () => api.get("/api/products").then((r) => r.data),
  get: (id) => api.get(`/api/products/${id}`).then((r) => r.data),
  create: (form) => api.post("/api/products", form).then((r) => r.data),
  update: (id, form) => api.patch(`/api/products/${id}`, form).then((r) => r.data),
  remove: (id) => api.delete(`/api/products/${id}`).then((r) => r.data),
};

export const ContactAPI = {
  send: (data) => api.post("/api/contactus", data).then((r) => r.data),
};
