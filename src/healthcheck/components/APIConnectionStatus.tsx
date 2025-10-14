"use client";

import type { HealthCheckLog, ConnectionDetails } from "../types";

import React from "react";
import { Icon } from "@iconify/react";

import {
  Box,
  Card,
  List,
  Chip,
  Paper,
  Button,
  ListItem,
  useTheme,
  Typography,
  CardContent,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";

interface APIConnectionStatusProps {
  isConnected: boolean | null;
  connectionDetails: ConnectionDetails | null;
  onRefresh: () => Promise<void>;
  recentLogs: HealthCheckLog[];
}

export const APIConnectionStatus: React.FC<APIConnectionStatusProps> = ({
  isConnected,
  connectionDetails,
  onRefresh,
  recentLogs,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    if (isConnected === null)
      return (
        <Icon
          icon="eva:clock-fill"
          color={theme.palette.warning.main}
          width={24}
        />
      );
    return isConnected ? (
      <Icon
        icon="eva:checkmark-circle-2-fill"
        color={theme.palette.success.main}
        width={24}
      />
    ) : (
      <Icon
        icon="eva:alert-circle-fill"
        color={theme.palette.error.main}
        width={24}
      />
    );
  };

  const getStatusColor = () => {
    if (isConnected === null) return "warning";
    return isConnected ? "success" : "error";
  };

  const getStatusText = () => {
    if (isConnected === null) return "Checking connection...";
    return isConnected
      ? "API is healthy and responsive"
      : "API is not responding";
  };

  const calculateStats = () => {
    if (recentLogs.length === 0) return null;

    const successful = recentLogs.filter((log) => log.success).length;
    const averageLatency = Math.round(
      recentLogs.reduce((sum, log) => sum + log.duration, 0) /
        recentLogs.length,
    );
    const successRate = Math.round((successful / recentLogs.length) * 100);

    return {
      successRate,
      averageLatency,
      totalRequests: recentLogs.length,
    };
  };

  const stats = calculateStats();

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return "success";
    if (latency < 500) return "warning";
    return "error";
  };

  const getLatencyThemeColor = (latency: number) => {
    if (latency < 100) return theme.palette.success.main;
    if (latency < 500) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box>
      {/* Main Status Card */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          alignItems={isMobile ? "flex-start" : "center"}
          justifyContent="space-between"
          gap={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            {getStatusIcon()}
            <Box>
              <Typography variant="h5" component="div" fontWeight="medium">
                Connection Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getStatusText()}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={
              isRefreshing ? (
                <CircularProgress size={16} />
              ) : (
                <Icon icon="eva:refresh-fill" />
              )
            }
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="large"
          >
            {isRefreshing ? "Checking..." : "Refresh"}
          </Button>
        </Box>

        {connectionDetails && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
              mt: 2,
            }}
          >
            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Environment
                </Typography>
                <Chip
                  label={connectionDetails.environment || "Unknown"}
                  color={
                    connectionDetails.environment === "production"
                      ? "error"
                      : "primary"
                  }
                  size="small"
                />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Base URL
                </Typography>
                <Typography variant="body2" fontWeight="medium" noWrap>
                  {connectionDetails.baseUrl}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Check
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {new Date(connectionDetails.timestamp).toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={connectionDetails.error ? "Error" : "Healthy"}
                  color={getStatusColor()}
                  size="small"
                />
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>

      {/* Statistics Cards */}
      {stats && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 3,
            mb: 3,
          }}
        >
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Icon
                icon="eva:trending-up-fill"
                color={theme.palette.primary.main}
                width={40}
                style={{ marginBottom: 8 }}
              />
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.successRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last {stats.totalRequests} requests
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Icon
                icon="eva:flash-fill"
                color={getLatencyThemeColor(stats.averageLatency)}
                width={40}
                style={{ marginBottom: 8 }}
              />
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.averageLatency}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Latency
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Response time
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Icon
                icon="eva:globe-fill"
                color={theme.palette.info.main}
                width={40}
                style={{ marginBottom: 8 }}
              />
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.totalRequests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Requests
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recent activity
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Recent Activity */}
      {recentLogs.length > 0 && (
        <Paper elevation={1} sx={{ borderRadius: 2 }}>
          <Box p={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent Activity
            </Typography>
            <List dense>
              {recentLogs.slice(0, 5).map((log) => (
                <ListItem key={log.id} divider>
                  <ListItemIcon>
                    {log.success ? (
                      <Icon
                        icon="eva:checkmark-circle-2-fill"
                        color={theme.palette.success.main}
                        width={20}
                      />
                    ) : (
                      <Icon
                        icon="eva:alert-circle-fill"
                        color={theme.palette.error.main}
                        width={20}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        flexWrap="wrap"
                      >
                        <Chip
                          label={log.method}
                          size="small"
                          color={log.success ? "success" : "error"}
                          variant="outlined"
                        />
                        <Typography variant="body2" component="span">
                          {log.endpoint}
                        </Typography>
                        <Chip
                          label={`${log.duration}ms`}
                          size="small"
                          color={getLatencyColor(log.duration)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestamp).toLocaleString()} • Status:{" "}
                        {log.status || "N/A"}
                        {log.error && ` • Error: ${log.error}`}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
