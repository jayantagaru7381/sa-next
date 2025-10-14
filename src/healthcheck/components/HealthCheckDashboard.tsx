"use client";

import type { NotificationState } from "../types";

import { Icon } from "@iconify/react";
import React, { useMemo, useState, useEffect, useCallback } from "react";

import {
  Box,
  Tab,
  Tabs,
  Chip,
  Paper,
  Alert,
  Snackbar,
  useTheme,
  Container,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { canAccessDevelopmentFeatures } from "src/lib/environment";

import { RequestLogger } from "./RequestLogger";
import { SystemMetrics } from "./SystemMetrics";
import { useApiLogs } from "../hooks/useApiLogs";
import { EndpointTester } from "./EndpointTester";
import { createApiCaller } from "../api/apiCaller";
import { OpenAPIExplorer } from "./OpenAPIExplorer";
import { ClientOnlyApiUrl } from "./ClientOnlyApiUrl";
import { APIConnectionStatus } from "./APIConnectionStatus";
import { useApiConnection } from "../hooks/useApiConnection";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`healthcheck-tabpanel-${index}`}
      aria-labelledby={`healthcheck-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const HealthCheckDashboard: React.FC = () => {
  // Always call hooks at the top level
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [activeTab, setActiveTab] = useState<number>(0);
  const [apiSchema, setApiSchema] = useState<any>(null);
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );

  const { logs, addLog, clearLogs } = useApiLogs();
  const makeAPICall = useMemo(() => createApiCaller(addLog), [addLog]);
  const { isConnected, connectionDetails, checkConnection } =
    useApiConnection(makeAPICall);

  const loadAPISchema = useCallback(async () => {
    try {
      const response = await makeAPICall("/openapi.json");
      if (response.ok && response.data) {
        const newSchema = response.data;

        setApiSchema((currentSchema: any) => {
          if (currentSchema && currentSchema.paths) {
            const oldPaths = Object.keys(currentSchema.paths || {});
            const newPaths = Object.keys(newSchema.paths || {});
            const addedPaths = newPaths.filter(
              (path) => !oldPaths.includes(path),
            );
            const removedPaths = oldPaths.filter(
              (path) => !newPaths.includes(path),
            );

            if (addedPaths.length > 0 || removedPaths.length > 0) {
              const message =
                addedPaths.length > 0
                  ? `🎉 ${addedPaths.length} new endpoint${addedPaths.length > 1 ? "s" : ""} discovered!`
                  : `⚠️ ${removedPaths.length} endpoint${removedPaths.length > 1 ? "s" : ""} removed`;

              setNotification({
                message,
                type: addedPaths.length > 0 ? "success" : "warning",
                show: true,
              });

              setTimeout(() => setNotification(null), 5000);
            }
          }

          return newSchema;
        });
      }
    } catch (error) {
      console.error("Failed to load API schema:", error);
    }
  }, [makeAPICall]);

  useEffect(() => {
    checkConnection();
    loadAPISchema();
  }, [checkConnection, loadAPISchema]);

  const connectionStatusColor = useMemo(() => {
    if (isConnected === null) return theme.palette.warning.main;
    return isConnected ? theme.palette.success.main : theme.palette.error.main;
  }, [isConnected, theme]);

  const connectionStatusText = useMemo(() => {
    if (isConnected === null) return "Checking...";
    return isConnected ? "Connected" : "Disconnected";
  }, [isConnected]);

  // Environment protection - only allow in development/QA environments
  if (!canAccessDevelopmentFeatures()) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Health Check Dashboard Unavailable
          </Typography>
          <Typography>
            This development tool is not available in production environments
            for security purposes.
          </Typography>
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const tabItems = [
    { label: "Overview", icon: "eva:pie-chart-2-fill", id: "overview" },
    { label: "Test Endpoints", icon: "eva:settings-2-fill", id: "endpoints" },
    { label: "Request Logs", icon: "eva:file-text-fill", id: "logs" },
    { label: "API Schema", icon: "eva:code-fill", id: "schema" },
    { label: "System Metrics", icon: "eva:activity-fill", id: "metrics" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box
            display="flex"
            flexDirection={isMobile ? "column" : "row"}
            alignItems={isMobile ? "flex-start" : "center"}
            justifyContent="space-between"
            gap={2}
          >
            <Box>
              <Typography
                variant="h3"
                component="h1"
                fontWeight="bold"
                color="info"
                gutterBottom
              >
                API Health Check Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Test and monitor backend APIs
              </Typography>
            </Box>

            <Box textAlign={isMobile ? "left" : "right"}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography
                  variant="h5"
                  component="div"
                  fontWeight="bold"
                  sx={{ color: connectionStatusColor }}
                >
                  {connectionStatusText}
                </Typography>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: connectionStatusColor,
                  }}
                />
              </Box>
              <ClientOnlyApiUrl />
            </Box>
          </Box>
        </Paper>

        {/* Navigation Tabs */}
        <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 64,
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
              },
            }}
          >
            {tabItems.map((tab, index) => (
              <Tab
                key={tab.id}
                icon={<Icon icon={tab.icon} width={20} />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {tab.label}
                    {tab.id === "logs" && logs.length > 0 && (
                      <Chip
                        label={logs.length}
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: "0.75rem" }}
                      />
                    )}
                  </Box>
                }
                iconPosition="start"
                sx={{ flexDirection: isMobile ? "column" : "row", gap: 1 }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <APIConnectionStatus
            isConnected={isConnected}
            connectionDetails={connectionDetails}
            onRefresh={checkConnection}
            recentLogs={logs.slice(0, 5)}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <EndpointTester
            apiSchema={apiSchema}
            makeAPICall={makeAPICall}
            isConnected={isConnected}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <RequestLogger logs={logs} onClear={clearLogs} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <OpenAPIExplorer schema={apiSchema} onRefresh={loadAPISchema} />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <SystemMetrics logs={logs} connectionDetails={connectionDetails} />
        </TabPanel>
      </Container>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification?.show || false}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={
            notification?.type === "warning"
              ? "warning"
              : notification?.type === "error"
                ? "error"
                : "success"
          }
          variant="filled"
          sx={{ minWidth: 300 }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
