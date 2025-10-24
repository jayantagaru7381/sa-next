"use client";

import type { JSX } from "react";

import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import { useProtectedRoute } from "../../../hooks";
import { useLogoutMutation, useGetProfileQuery } from "../../../store/authApi";

const DashboardPage: React.FC = (): JSX.Element => {
  // Protect route from unauthenticated access (client-side)
  // Server-side protection handled by middleware
  useProtectedRoute();

  const { data: profileData, isLoading, error: profileError } = useGetProfileQuery({});
  const [_logout, { isLoading: logoutIsLoading, error: _logoutError }] = useLogoutMutation();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call backend to clear httpOnly cookies (sess, temp_sess, csrf)
      await _logout({}).unwrap();
    } catch (err) {
      console.error("Logout error:", err);
    }
    // Redirect to login
    router.push("/login");
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 6, display: "grid", placeItems: "center", gap: 2 }}>
        <CircularProgress />
        <Typography>Loading profile…</Typography>
      </Box>
    );
  }

  if (profileError) {
    return (
      <Box sx={{ p: 6, display: "grid", placeItems: "center", gap: 2 }}>
        <Alert severity="error">
          {(profileError as any)?.data?.detail || "Failed to load profile. Please log in again."}
        </Alert>
        <Button variant="contained" onClick={() => router.push("/login")}>
          Return to Login
        </Button>
      </Box>
    );
  }

  const profile = profileData?.user;

  return (
    <Box>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          {_logoutError && (
            <Alert severity="error" sx={{ mr: 2 }}>
              Logout failed. Please try again.
            </Alert>
          )}
          <Button
            color="inherit"
            onClick={handleLogout}
            disabled={logoutIsLoading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {logoutIsLoading ? "Logging out..." : "Logout"}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 6 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {profile?.first_name} {profile?.last_name}!
        </Typography>
        <Typography variant="body1">Email: {profile?.email}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Account status: {profile?.is_active ? "Active" : "Inactive"}
        </Typography>
      </Box>
    </Box>
  );
};
export default DashboardPage;
