import { setupListeners } from "@reduxjs/toolkit/query";
import { configureStore, combineReducers } from "@reduxjs/toolkit";

import { authApi } from "./authApi";
import { AuthSlice } from "./slice/AuthSlice";

const appReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  AuthSlice: AuthSlice.reducer
});

const rootReducer = (state: any, action: any) => {
  if (action.type === "RESET_STATE") {
    state = {};
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      authApi.middleware,
    ),
});
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

// Enable refetchOnFocus/refetchOnReconnect behaviors for RTK Query
setupListeners(store.dispatch);
