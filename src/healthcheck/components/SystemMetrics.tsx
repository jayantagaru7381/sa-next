"use client";

import type {
  HealthCheckLog,
  ConnectionDetails,
  SystemMetricsData,
} from "../types";

import { Icon } from "@iconify/react";
import React, { useMemo } from "react";

import {
  Box,
  Card,
  Chip,
  Paper,
  Table,
  Alert,
  TableRow,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CardContent,
  useMediaQuery,
  LinearProgress,
  TableContainer,
} from "@mui/material";

interface SystemMetricsProps {
  logs: HealthCheckLog[];
  connectionDetails: ConnectionDetails | null;
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({
  logs,
  connectionDetails,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const metrics = useMemo(() => {
    if (logs.length === 0) return null;

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentLogs = logs.filter(
      (log) => new Date(log.timestamp).getTime() > oneHourAgo,
    );
    const dailyLogs = logs.filter(
      (log) => new Date(log.timestamp).getTime() > oneDayAgo,
    );

    const calculateMetrics = (
      logSet: HealthCheckLog[],
    ): SystemMetricsData | null => {
      if (logSet.length === 0) return null;

      const successful = logSet.filter((log) => log.success).length;
      const failed = logSet.length - successful;
      const successRate = (successful / logSet.length) * 100;
      const errorRate = (failed / logSet.length) * 100;

      const latencies = logSet.map((log) => log.duration);
      const avgLatency =
        latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const minLatency = Math.min(...latencies);
      const maxLatency = Math.max(...latencies);

      const sortedLatencies = [...latencies].sort((a, b) => a - b);
      const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;
      const p99Index = Math.ceil(sortedLatencies.length * 0.99) - 1;

      const methodStats = logSet.reduce(
        (acc, log) => {
          acc[log.method] = (acc[log.method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        successRate,
        totalRequests: logSet.length,
        averageLatency: avgLatency,
        minLatency,
        maxLatency,
        p95Latency: sortedLatencies[p95Index] || 0,
        p99Latency: sortedLatencies[p99Index] || 0,
        methodStats,
        errorRate,
      };
    };

    return {
      recent: calculateMetrics(recentLogs),
      daily: calculateMetrics(dailyLogs),
      overall: calculateMetrics(logs),
    };
  }, [logs]);

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return theme.palette.success.main;
    if (latency < 500) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (!metrics?.overall) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          No Metrics Available
        </Typography>
        <Typography>
          Make some API requests to see performance metrics and system
          statistics.
        </Typography>
      </Alert>
    );
  }

  const MetricCard = ({
    title,
    value,
    unit = "",
    icon,
    color = "primary",
    subtitle,
    progress,
  }: {
    title: string;
    value: number | string;
    unit?: string;
    icon: React.ReactNode;
    color?: "primary" | "secondary" | "success" | "warning" | "error" | "info";
    subtitle?: string;
    progress?: number;
  }) => (
    <Card elevation={2}>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box color={theme.palette[color].main}>{icon}</Box>
          <Typography variant="h4" component="div" fontWeight="bold">
            {typeof value === "number" && !Number.isInteger(value)
              ? value.toFixed(1)
              : value}
            {unit}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {progress !== undefined && (
          <Box mt={1}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={color}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Connection Status */}
      {connectionDetails && (
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Connection Information
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            <Box>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Environment
                </Typography>
                <Chip
                  label={connectionDetails.environment}
                  color={
                    connectionDetails.environment === "production"
                      ? "error"
                      : "primary"
                  }
                />
              </Box>
            </Box>
            <Box>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Base URL
                </Typography>
                <Typography variant="body2" fontWeight="medium" noWrap>
                  {connectionDetails.baseUrl}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {new Date(connectionDetails.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                >
                  {connectionDetails.error ? (
                    <Icon
                      icon="eva:alert-circle-fill"
                      color={theme.palette.error.main}
                      width={16}
                    />
                  ) : (
                    <Icon
                      icon="eva:checkmark-circle-2-fill"
                      color={theme.palette.success.main}
                      width={16}
                    />
                  )}
                  <Typography variant="body2">
                    {connectionDetails.error ? "Error" : "Healthy"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Overall Metrics */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Overall Performance Metrics
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          <Box>
            <MetricCard
              title="Success Rate"
              value={metrics.overall.successRate}
              unit="%"
              icon={<Icon icon="eva:bar-chart-fill" width={24} />}
              color={
                metrics.overall.successRate >= 95
                  ? "success"
                  : metrics.overall.successRate >= 90
                    ? "warning"
                    : "error"
              }
              subtitle={`${metrics.overall.totalRequests} total requests`}
              progress={metrics.overall.successRate}
            />
          </Box>
          <Box>
            <MetricCard
              title="Average Latency"
              value={metrics.overall.averageLatency}
              unit="ms"
              icon={<Icon icon="eva:flash-fill" width={24} />}
              color={
                metrics.overall.averageLatency < 100
                  ? "success"
                  : metrics.overall.averageLatency < 500
                    ? "warning"
                    : "error"
              }
              subtitle="Response time"
            />
          </Box>
          <Box>
            <MetricCard
              title="95th Percentile"
              value={metrics.overall.p95Latency}
              unit="ms"
              icon={<Icon icon="eva:trending-up-fill" width={24} />}
              color={
                metrics.overall.p95Latency < 200
                  ? "success"
                  : metrics.overall.p95Latency < 1000
                    ? "warning"
                    : "error"
              }
              subtitle="P95 latency"
            />
          </Box>
          <Box>
            <MetricCard
              title="Total Requests"
              value={metrics.overall.totalRequests}
              icon={<Icon icon="eva:globe-fill" width={24} />}
              color="info"
              subtitle="All time"
            />
          </Box>
        </Box>
      </Paper>

      {/* Recent Metrics */}
      {metrics.recent && (
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Performance (Last Hour)
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            <Box>
              <MetricCard
                title="Recent Success Rate"
                value={metrics.recent.successRate}
                unit="%"
                icon={<Icon icon="eva:checkmark-circle-2-fill" width={24} />}
                color={
                  metrics.recent.successRate >= 95
                    ? "success"
                    : metrics.recent.successRate >= 90
                      ? "warning"
                      : "error"
                }
                subtitle={`${metrics.recent.totalRequests} requests`}
                progress={metrics.recent.successRate}
              />
            </Box>
            <Box>
              <MetricCard
                title="Recent Avg Latency"
                value={metrics.recent.averageLatency}
                unit="ms"
                icon={<Icon icon="eva:flash-fill" width={24} />}
                color={
                  metrics.recent.averageLatency < 100
                    ? "success"
                    : metrics.recent.averageLatency < 500
                      ? "warning"
                      : "error"
                }
                subtitle="Last hour"
              />
            </Box>
            <Box>
              <MetricCard
                title="Error Rate"
                value={metrics.recent.errorRate}
                unit="%"
                icon={<Icon icon="eva:alert-triangle-fill" width={24} />}
                color={
                  metrics.recent.errorRate < 5
                    ? "success"
                    : metrics.recent.errorRate < 10
                      ? "warning"
                      : "error"
                }
                subtitle="Recent errors"
                progress={metrics.recent.errorRate}
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* Latency Breakdown */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Latency Breakdown
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          <Box>
            <Box textAlign="center" p={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Minimum
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: getLatencyColor(metrics.overall.minLatency) }}
              >
                {Math.round(metrics.overall.minLatency)}ms
              </Typography>
            </Box>
          </Box>
          <Box>
            <Box textAlign="center" p={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Average
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: getLatencyColor(metrics.overall.averageLatency) }}
              >
                {Math.round(metrics.overall.averageLatency)}ms
              </Typography>
            </Box>
          </Box>
          <Box>
            <Box textAlign="center" p={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                P99
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: getLatencyColor(metrics.overall.p99Latency) }}
              >
                {Math.round(metrics.overall.p99Latency)}ms
              </Typography>
            </Box>
          </Box>
          <Box>
            <Box textAlign="center" p={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Maximum
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: getLatencyColor(metrics.overall.maxLatency) }}
              >
                {Math.round(metrics.overall.maxLatency)}ms
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Method Statistics */}
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            HTTP Method Distribution
          </Typography>
          <TableContainer>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>Method</TableCell>
                  <TableCell align="right">Requests</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                  <TableCell align="right">Distribution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(metrics.overall.methodStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([method, count]) => {
                    const percentage =
                      (count / (metrics.overall?.totalRequests || 1)) * 100;
                    return (
                      <TableRow key={method} hover>
                        <TableCell>
                          <Chip
                            label={method}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="medium">{count}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography>{percentage.toFixed(1)}%</Typography>
                        </TableCell>
                        <TableCell align="right" width="30%">
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                              color="primary"
                            />
                            <Typography variant="caption">
                              {percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  );
};
