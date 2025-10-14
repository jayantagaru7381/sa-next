import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { resetPasswordURL, forgotPasswordURL } from "../utils/urls-list";
import { TEMP_TOKEN_ENDPOINTS, EXCLUDE_AUTH_ENDPOINTS, SESSION_TOKEN_ENDPOINTS } from "../utils/Constants";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}`,
    prepareHeaders: (headers, { endpoint }) => {
      headers.set("Content-Type", "application/json");
      console.log("Preparing headers for endpoint:", endpoint);
      // Exclude password flows
      if (EXCLUDE_AUTH_ENDPOINTS.includes(endpoint)) {
        return headers;
      }
      if (typeof window !== "undefined") {
        if (TEMP_TOKEN_ENDPOINTS.has(endpoint)) {
          const tempToken = sessionStorage.getItem("tempToken");
          if (tempToken) headers.set("X-Temp-Token", tempToken);
        }
        if (SESSION_TOKEN_ENDPOINTS.has(endpoint)) {
          const sessionToken = localStorage.getItem("sessionToken");
          console.log("sessionToken", sessionToken);
          if (sessionToken) headers.set("X-Session-Token", sessionToken);
        }
      }
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
    magickLink: builder.mutation({
      query: (payload) => ({
        url: `/auth/magic_link/request`,
        method: "POST",
        body: payload,
      }),
    }),
    magicLinkExchange: builder.mutation({
      query: (payload) => ({
        url: `/auth/magic_link/exchange`,
        method: "POST",
        body: payload,
      }),
    }),
    authEntraCallback: builder.mutation({
      query: (payload) => ({
        url: `/auth/entra/callback`,
        method: "POST",
        body: payload,
        credentials: "include",
      }),
    }),
    authMfa: builder.mutation({
      query: ({ payload, mode }) => ({
        url: `/auth/mfa/authenticate/${mode}/initiate`,
        method: "POST",
        body: payload,
        credentials: "include",
      }),
    }),
    mfaVerify: builder.mutation({
      query: ({ payload, mode }) => ({
        url: `/auth/mfa/authenticate/${mode}/verify`,
        method: "POST",
        body: payload,
        credentials: "include",
      }),
    }),
    authMfaRegister: builder.mutation({
      query: ({ payload, mode }) => ({
        url: `/auth/mfa/register/${mode}/initiate`,
        method: "POST",
        body: payload,
        credentials: "include",
      }),
    }),
    mfaVerifyRegister: builder.mutation({
      query: ({ payload, mode }) => ({
        url: `/auth/mfa/register/${mode}/verify`,
        method: "POST",
        body: payload,
        credentials: "include",
      }),
    }),
    validatePasswordLink: builder.mutation({
      query: (payload) => ({
        url: `/auth/users/password-reset/validate-password-reset-link`,
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
  useMagickLinkMutation,
  useMagicLinkExchangeMutation,
  useAuthEntraCallbackMutation,
  useAuthMfaMutation,
  useMfaVerifyMutation,
  useAuthMfaRegisterMutation,
  useMfaVerifyRegisterMutation,
  useValidatePasswordLinkMutation,
} = authApi;
