import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { UsersAPI } from "../api";

export const checkAuth = createAsyncThunk("auth/check", async () => {
  const loggedIn = await UsersAPI.status();
  if (!loggedIn) return { loggedIn: false, user: null };
  return { loggedIn: true, user: await UsersAPI.me() };
});

export const loginUser = createAsyncThunk("auth/login", (credentials) => UsersAPI.login(credentials));
export const logoutUser = createAsyncThunk("auth/logout", () => UsersAPI.logout());
export const updateProfile = createAsyncThunk("auth/updateProfile", (form) => UsersAPI.update(form));

const authSlice = createSlice({
  name: "auth",
  initialState: { checked: false, loggedIn: false, user: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.fulfilled, (state, { payload }) => {
        state.checked = true;
        state.loggedIn = payload.loggedIn;
        state.user = payload.user;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.checked = true;
        state.loggedIn = false;
        state.user = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.checked = true;
        state.loggedIn = true;
        state.user = payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loggedIn = false;
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loggedIn = false;
        state.user = null;
      })
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.user = payload;
      });
  },
});

export default authSlice.reducer;
export const selectAuth = (state) => state.auth;
