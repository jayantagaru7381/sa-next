"use client";

import type { JSX } from "react";
import type { UserProfile } from "../../types/dashboard";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

import { useLogoutMutation } from "../../store/authApi";
import LottieAnimation from "../../components/common/lottie-animation/LottieAnimation";
import animationData from "../../../public/lotties/Loadingcircles.json";
const DashboardPage: React.FC = (): JSX.Element => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_logout, { isLoading: logoutIsLoading, error: _logoutError }] = useLogoutMutation();
  const router = useRouter();
  // const localStorageState = useLocalStorageState();

  useEffect(() => {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      setProfile(JSON.parse(stored));
      setLoading(false);
    } else {
      setError("User profile not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      // createApiHeaders(true, true);
      // const result = await logout({}).unwrap();
      // // If logout mutation returns an error, do not redirect
      // if (logoutError || (result && result.error)) {
      //   // setError('Logout failed. Please try again.');
      //   console.error("Logout error:", logoutError || result.error);
      //   return;
      // }
      // clearAllTokens();
      // localStorageState.clearInitialRequestFlag();
      // localStorageState.clearPageLoadCount();
      router.push("/");
    } catch (err) {
      // setError('Logout failed. Please try again.');
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, display: "grid", placeItems: "center", gap: 2 }}>
        <CircularProgress />
        <Typography>Loading profile…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 6, display: "grid", placeItems: "center", gap: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          {error && (
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
      <LottieAnimation animationData={animationData} />
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
