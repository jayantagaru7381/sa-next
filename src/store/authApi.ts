import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { clearAllTokens } from "src/utils/tokenManager";

import { resetPasswordURL, forgotPasswordURL } from "../utils/urls-list";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/**
 * Auth API - Cookie-based authentication
 * All authentication is handled via httpOnly cookies (sess, temp_sess, csrf)
 * No tokens are stored in localStorage or sessionStorage
 * Middleware automatically manages cookie forwarding
 */
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE}`,
    credentials: "include", // Always send cookies with requests
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");

      // Add CSRF token from cookie for all requests
      if (typeof window !== "undefined") {
        const csrfToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrf="))
          ?.split("=")[1];
        if (csrfToken) {
          headers.set("X-CSRF-Token", csrfToken);
        }
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.query({
      query: () => ({
        url: `/auth/entra/login`,
      }),
    }),
    nativeLogin: builder.mutation({
      query: (payload) => ({
        url: `/auth/native/login`,
        method: "POST",
        body: payload,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: `/auth/native/logout`,
        method: "POST",
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          clearAllTokens(); // <-- Clear tokens after successful logout
        } catch (logoutError) {
          clearAllTokens(); // <-- Clear tokens even after unsuccessful logout
          // Optionally handle error
          // console.error("Logout failed:", logoutError);
        }
      },
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
      }),
    }),
    authMfa: builder.mutation({
      query: ({ payload, mode }) => ({
        url: `/auth/mfa/authenticate/${mode}/initiate`,
        method: "POST",
        body: payload,
      }),
    }),
    mfaVerify: builder.mutation({
      query: ({ payload, mode }) => ({
        url: `/auth/mfa/authenticate/${mode}/verify`,
        method: "POST",
        body: payload,
      }),
    }),
    authMfaRegister: builder.mutation({
      query: ({ payload, mode }) => ({
        url: `/auth/mfa/register/${mode}/initiate`,
        method: "POST",
        body: payload,
      }),
    }),
    mfaVerifyRegister: builder.mutation({
      query: ({ payload, mode }) => ({
        url: `/auth/mfa/register/${mode}/verify`,
        method: "POST",
        body: payload,
      }),
    }),

    // Get user profile (uses session cookie)
    getProfile: builder.query({
      query: () => ({
        url: `/auth/native/profile`,
        method: "GET",
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
  useLazyGetProfileQuery,
  useGetProfileQuery,
  useValidatePasswordLinkMutation
} = authApi;
