import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { resetPasswordURL, forgotPasswordURL } from "../utils/urls-list";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}`,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.query({
      query: () => ({
        url: `/auth/entra/login`,
        credentials: "include",
      }),
    }),
    nativeLogin: builder.mutation({
      query: (payload) => ({
        url: `/auth/native/login`,
        method: "POST",
        credentials: "include",
        body: payload,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: `/auth/native/logout`,
        method: "POST",
        credentials: "include",
      }),
    }),

    forgotPassword: builder.mutation({
      query: (payload) => ({
        url: forgotPasswordURL,
        method: "POST",
        body: payload,
      }),
    }),

    resetPassword: builder.mutation({
      query: (payload) => ({
        url: resetPasswordURL,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useLazyLoginQuery,
  useNativeLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
