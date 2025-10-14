import { createSlice } from "@reduxjs/toolkit";

import { authApi } from "../authApi";

const initialState: any = {
  userLoginInfo: {},
  token: {},
  tokenObj: {},
  resetPassword: {}
};

export const AuthSlice = createSlice({
  name: "AuthSlice",
  initialState,
  reducers: {
    logout: (state) => {
      state.userLoginInfo = {};
    },
    setAuthTokens: (state, action) => {
      state.tokenObj = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.userLoginInfo = payload;
    });
    builder.addMatcher(authApi.endpoints.login.matchRejected, (state, { payload }) => {
      state.userLoginInfo = payload;
    });
    builder.addMatcher(authApi.endpoints.nativeLogin.matchFulfilled, (state, { payload }) => {
      state.userLoginInfo = payload;
    });
    builder.addMatcher(authApi.endpoints.nativeLogin.matchRejected, (state, { payload }) => {
      state.userLoginInfo = payload;
    });
    builder.addMatcher(authApi.endpoints.resetPassword.matchFulfilled, (state, { payload }) => {
      state.resetPassword = payload;
    });
    builder.addMatcher(authApi.endpoints.resetPassword.matchRejected, (state, { payload }) => {
      state.resetPassword = payload;
    });
  },
});
export const { logout, setAuthTokens } = AuthSlice.actions;
export default AuthSlice.reducer;