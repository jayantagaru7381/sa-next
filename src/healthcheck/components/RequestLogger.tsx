"use client";

import type { HealthCheckLog } from "../types";

import { Icon } from "@iconify/react";
import React, { useMemo, useState } from "react";

import {
  Box,
  Chip,
  Card,
  Paper,
  Table,
  Button,
  Dialog,
  Select,
  TableRow,
  MenuItem,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  DialogTitle,
  FormControl,
  CardContent,
  DialogContent,
  DialogActions,
  useMediaQuery,
  TableContainer,
  TablePagination,
} from "@mui/material";

interface RequestLoggerProps {
  logs: HealthCheckLog[];
  onClear: () => void;
}

interface LogDetailDialogProps {
  open: boolean;
  log: HealthCheckLog | null;
  onClose: () => void;
}

const LogDetailDialog: React.FC<LogDetailDialogProps> = ({
  open,
  log,
  onClose,
}) => {
  if (!log) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Request Details</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Request Information
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Method & Endpoint
              </Typography>
              <Typography variant="body1">
                {log.method} {log.endpoint}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Timestamp
              </Typography>
              <Typography variant="body1">
                {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1">{log.duration}ms</Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={log.status || "N/A"}
                color={log.success ? "success" : "error"}
                size="small"
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Response Information
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Success
              </Typography>
              <Chip
                label={log.success ? "Yes" : "No"}
                color={log.success ? "success" : "error"}
                size="small"
              />
            </Box>
            {log.size && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Response Size
                </Typography>
                <Typography variant="body1">{log.size} bytes</Typography>
              </Box>
            )}
            {log.error && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Error
                </Typography>
                <Typography variant="body1" color="error.main">
                  {log.error}
                </Typography>
              </Box>
            )}
          </Box>

          {log.requestHeaders && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="h6" gutterBottom>
                Request Headers
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={JSON.stringify(log.requestHeaders, null, 2)}
                InputProps={{ readOnly: true }}
              />
            </Box>
          )}

          {log.requestBody && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="h6" gutterBottom>
                Request Body
              </Typography>
              <TextField
                multiline
                rows={6}
                fullWidth
                variant="outlined"
                value={JSON.stringify(log.requestBody, null, 2)}
                InputProps={{ readOnly: true }}
              />
            </Box>
          )}

          {log.responseBody && (
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="h6" gutterBottom>
                Response Body
              </Typography>
              <TextField
                multiline
                rows={6}
                fullWidth
                variant="outlined"
                value={JSON.stringify(log.responseBody, null, 2)}
                InputProps={{ readOnly: true }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const RequestLogger: React.FC<RequestLoggerProps> = ({
  logs,
  onClear,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState<HealthCheckLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterMethod, setFilterMethod] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const matchesMethod = !filterMethod || log.method === filterMethod;
        const matchesStatus =
          !filterStatus ||
          (filterStatus === "success" && log.success) ||
          (filterStatus === "error" && !log.success);
        return matchesMethod && matchesStatus;
      }),
    [logs, filterMethod, filterStatus],
  );

  const paginatedLogs = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (log: HealthCheckLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedLog(null);
  };

  const getStatusColor = (success: boolean) => (success ? "success" : "error");

  const getLatencyColor = (duration: number) => {
    if (duration < 100) return "success";
    if (duration < 500) return "warning";
    return "error";
  };

  const uniqueMethods = Array.from(new Set(logs.map((log) => log.method)));

  if (isMobile) {
    return (
      <Box>
        {/* Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Typography variant="h5" component="h2">
              Request Logs ({filteredLogs.length})
            </Typography>

            {/* Filters */}
            <Box display="flex" gap={2} width="100%">
              <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                <InputLabel>Method</InputLabel>
                <Select
                  value={filterMethod}
                  label="Method"
                  onChange={(e) => setFilterMethod(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="outlined"
              color="error"
              startIcon={<Icon icon="eva:trash-2-fill" />}
              onClick={onClear}
              disabled={logs.length === 0}
            >
              Clear Logs
            </Button>
          </Box>
        </Paper>

        {/* Mobile Cards */}
        <Box>
          {paginatedLogs.map((log) => (
            <Card key={log.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Chip
                    label={log.method}
                    color={getStatusColor(log.success)}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>

                <Typography variant="body2" fontWeight="medium" mb={1}>
                  {log.endpoint}
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  <Chip
                    label={`${log.duration}ms`}
                    color={getLatencyColor(log.duration)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={log.status || "N/A"}
                    color={getStatusColor(log.success)}
                    size="small"
                  />
                  {log.size && (
                    <Chip
                      label={`${log.size} bytes`}
                      size="small"
                      variant="outlined"
                      color="info"
                    />
                  )}
                </Box>

                {log.error && (
                  <Typography variant="body2" color="error.main" mb={1}>
                    Error: {log.error}
                  </Typography>
                )}

                <Button
                  size="small"
                  startIcon={<Icon icon="eva:eye-fill" />}
                  onClick={() => handleViewDetails(log)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}

          {filteredLogs.length > rowsPerPage && (
            <TablePagination
              component="div"
              count={filteredLogs.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </Box>

        <LogDetailDialog
          open={detailDialogOpen}
          log={selectedLog}
          onClose={handleCloseDetailDialog}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box
          display="flex"
          flexDirection="row"
          gap={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5" component="h2">
            Request Logs ({filteredLogs.length})
          </Typography>

          <Box display="flex" gap={2} alignItems="center">
            {/* Filters */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Method</InputLabel>
              <Select
                value={filterMethod}
                label="Method"
                onChange={(e) => setFilterMethod(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {uniqueMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              color="error"
              startIcon={<Icon icon="eva:trash-2-fill" />}
              onClick={onClear}
              disabled={logs.length === 0}
            >
              Clear Logs
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Desktop Table */}
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Method</TableCell>
              <TableCell>Endpoint</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Duration</TableCell>
              <TableCell align="center">Size</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.map((log) => (
              <React.Fragment key={log.id}>
                <TableRow hover>
                  <TableCell>
                    <Chip
                      label={log.method}
                      color={getStatusColor(log.success)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {log.endpoint}
                    </Typography>
                    {log.error && (
                      <Typography variant="caption" color="error.main">
                        {log.error}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={log.status || "N/A"}
                      color={getStatusColor(log.success)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${log.duration}ms`}
                      color={getLatencyColor(log.duration)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {log.size ? `${log.size} bytes` : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(log)}
                      color="primary"
                    >
                      <Icon icon="eva:eye-fill" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filteredLogs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      <LogDetailDialog
        open={detailDialogOpen}
        log={selectedLog}
        onClose={handleCloseDetailDialog}
      />
    </Box>
  );
};
