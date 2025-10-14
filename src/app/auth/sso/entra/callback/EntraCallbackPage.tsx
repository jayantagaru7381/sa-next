'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Box, Alert, Button, Typography, CircularProgress } from '@mui/material';

import { handleTokenResponse } from 'src/utils/tokenManager';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type LoginResponse = {
  detail: string | undefined;
  result: 'success' | 'failure' | 'mfa_setup_required' | 'mfa_auth_required' | 'email_verification_required';
  message?: string;
  temp_token?: string | null;
  session_token?: string | null;
  redirect_url?: string | null;
  user_id?: number;
  details?: {
    enrolled_methods?: string[];
  };
};

export default function EntraCallbackPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const err = sp.get('error');
      const errDesc = sp.get('error_description');
      if (err) {
        setError(`${err}: ${decodeURIComponent(errDesc ?? '') || 'Authentication failed'}`);
        return;
      }

      const code = sp.get('code');
      const state = sp.get('state') || undefined;
      const session_state = sp.get('session_state') || undefined;

      if (!code) {
        setError('Missing authorization code.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/entra/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code, state, session_state }),
        });

        if (!res.ok) {
          // Try to get error message from response
          let errorMessage = `Login failed with status: ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.detail || errorMessage;
          } catch {
            // If JSON parsing fails, use status text or default message
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const contentType = res.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
          // Try to get the response text for debugging
          const responseText = await res.text();
          console.error('Non-JSON response received:', responseText);
          throw new Error('Invalid response format from server. Please try again.');
        }

        // Get response text first to debug
        const responseText = await res.text();

        if (!responseText.trim()) {
          throw new Error('Empty response from server. Please try again.');
        }

        const data: LoginResponse = JSON.parse(responseText);
        const { shouldRedirect, redirectUrl } = await handleTokenResponse(data);

        if (data.result === 'mfa_setup_required') {
          router.push(`/mfa/register`);
          return;
        }
        if (data.result === 'mfa_auth_required') {
          const enrolled_methods = data.details?.enrolled_methods;
          if (enrolled_methods?.length === 1) {
            if (enrolled_methods[0] === 'totp') {
              router.push(`/mfa/authenticate/authenticatormfa/authverifycode`);
            }
            if (enrolled_methods[0] === 'phone_otp') {
              router.push(`/mfa/authenticate/smsmfa/codecheck`);
            }
            if (enrolled_methods[0] === 'email_otp') {
              router.push(`/mfa/authenticate/emailmfa`);
            }
          }
          return
        }

        if (data.result === 'email_verification_required') {
          router.push(`/mfa/authenticate/emailmfa/codecheck`);
          return;
        }

        if (shouldRedirect) {
          router.push(redirectUrl!);
        }
      } catch (e: any) {
        setError(e?.message || 'Authentication failed.');
      }
    })();
  }, [sp, router]);

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 440, mx: 'auto', display: 'grid', gap: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => router.replace('/')}>
          Back to sign in
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 6, display: 'grid', placeItems: 'center', gap: 2 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Finalizing sign-in…
      </Typography>
    </Box>
  );
}