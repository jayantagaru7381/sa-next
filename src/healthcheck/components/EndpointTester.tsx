"use client";

import type { APIEndpoint } from "../types";

import { Icon } from "@iconify/react";
import React, { useMemo, useState, useEffect } from "react";

import {
  Box,
  Card,
  Chip,
  List,
  Paper,
  Alert,
  Button,
  Dialog,
  Select,
  MenuItem,
  Snackbar,
  ListItem,
  useTheme,
  TextField,
  Accordion,
  Typography,
  IconButton,
  InputLabel,
  CardContent,
  DialogTitle,
  FormControl,
  ListItemText,
  DialogContent,
  useMediaQuery,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from "@mui/material";

interface EndpointTesterProps {
  apiSchema: any;
  makeAPICall: (
    endpoint: string,
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    body?: any,
    headers?: Record<string, string>,
  ) => Promise<any>;
  isConnected: boolean | null;
}

interface TestResult {
  success: boolean;
  status: number;
  data: any;
  error?: string;
  duration: number;
}

export const EndpointTester: React.FC<EndpointTesterProps> = ({
  apiSchema,
  makeAPICall,
  isConnected,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(
    null,
  );
  const [requestBody, setRequestBody] = useState("{}");
  const [customHeaders, setCustomHeaders] = useState("{}");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<TestResult | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Parse API schema and extract endpoints
  useEffect(() => {
    if (!apiSchema?.paths) return;

    const parsedEndpoints: APIEndpoint[] = [];

    Object.entries(apiSchema.paths).forEach(
      ([path, pathData]: [string, any]) => {
        Object.entries(pathData).forEach(
          ([method, methodData]: [string, any]) => {
            if (typeof methodData === "object" && methodData.operationId) {
              parsedEndpoints.push({
                path,
                method: method.toUpperCase(),
                summary:
                  methodData.summary || `${method.toUpperCase()} ${path}`,
                description: methodData.description,
                parameters: methodData.parameters || [],
                responses: methodData.responses || {},
                tags: methodData.tags || [],
              });
            }
          },
        );
      },
    );

    setEndpoints(parsedEndpoints);
    if (parsedEndpoints.length > 0 && !selectedEndpoint) {
      setSelectedEndpoint(parsedEndpoints[0]);
    }
  }, [apiSchema, selectedEndpoint]);

  const filteredEndpoints = useMemo(
    () =>
      endpoints.filter((endpoint) => {
        const matchesSearch =
          !searchTerm ||
          endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          endpoint.summary?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTag = !tagFilter || endpoint.tags?.includes(tagFilter);
        const matchesMethod = !methodFilter || endpoint.method === methodFilter;

        return matchesSearch && matchesTag && matchesMethod;
      }),
    [endpoints, searchTerm, tagFilter, methodFilter],
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    endpoints.forEach((endpoint) => {
      endpoint.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [endpoints]);

  const allMethods = useMemo(() => {
    const methods = new Set<string>();
    endpoints.forEach((endpoint) => {
      methods.add(endpoint.method);
    });
    return Array.from(methods).sort();
  }, [endpoints]);

  const handleTestEndpoint = async () => {
    if (!selectedEndpoint) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      let parsedBody;
      let parsedHeaders;

      try {
        parsedBody = requestBody.trim() ? JSON.parse(requestBody) : undefined;
      } catch {
        throw new Error("Invalid JSON in request body");
      }

      try {
        parsedHeaders = customHeaders.trim()
          ? JSON.parse(customHeaders)
          : undefined;
      } catch {
        throw new Error("Invalid JSON in headers");
      }

      const response = await makeAPICall(
        selectedEndpoint.path,
        selectedEndpoint.method as any,
        parsedBody,
        parsedHeaders,
      );

      const duration = Date.now() - startTime;

      const result: TestResult = {
        success: response.ok,
        status: response.status,
        data: response.data,
        error: response.error,
        duration,
      };

      setLastResponse(result);
      setResponseDialogOpen(true);
      setNotification({
        message: `Request completed in ${duration}ms`,
        type: result.success ? "success" : "error",
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        success: false,
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      };

      setLastResponse(result);
      setResponseDialogOpen(true);
      setNotification({
        message: `Request failed: ${result.error}`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "primary";
      case "POST":
        return "success";
      case "PUT":
        return "warning";
      case "DELETE":
        return "error";
      case "PATCH":
        return "info";
      default:
        return "default";
    }
  };

  if (!isConnected) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          API Not Connected
        </Typography>
        <Typography>
          Connect to the API first to test endpoints. Check the Overview tab for
          connection status.
        </Typography>
      </Alert>
    );
  }

  if (endpoints.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          No API Schema Loaded
        </Typography>
        <Typography>
          Load the API schema first to discover and test available endpoints.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        {/* Endpoint List */}
        <Box>
          <Paper elevation={1} sx={{ borderRadius: 2, height: "fit-content" }}>
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                Available Endpoints ({filteredEndpoints.length})
              </Typography>

              {/* Filters */}
              <Box mb={3}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search endpoints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Icon
                            icon="eva:search-fill"
                            color="currentColor"
                            style={{ marginRight: 4, opacity: 0.6 }}
                          />
                        ),
                      }}
                    />
                  </Box>
                  <Box>
                    <FormControl fullWidth size="small">
                      <InputLabel>Method</InputLabel>
                      <Select
                        value={methodFilter}
                        label="Method"
                        onChange={(e) => setMethodFilter(e.target.value)}
                      >
                        <MenuItem value="">All Methods</MenuItem>
                        {allMethods.map((method) => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tag</InputLabel>
                      <Select
                        value={tagFilter}
                        label="Tag"
                        onChange={(e) => setTagFilter(e.target.value)}
                      >
                        <MenuItem value="">All Tags</MenuItem>
                        {allTags.map((tag) => (
                          <MenuItem key={tag} value={tag}>
                            {tag}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Box>

              {/* Endpoint Cards */}
              <Box sx={{ maxHeight: 600, overflow: "auto" }}>
                {filteredEndpoints.map((endpoint, index) => (
                  <Card
                    key={`${endpoint.method}-${endpoint.path}`}
                    variant={
                      selectedEndpoint === endpoint ? "elevation" : "outlined"
                    }
                    elevation={selectedEndpoint === endpoint ? 3 : 0}
                    sx={{
                      mb: 2,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      border: selectedEndpoint === endpoint ? 2 : 1,
                      borderColor:
                        selectedEndpoint === endpoint
                          ? "primary.main"
                          : "divider",
                      "&:hover": {
                        elevation: 2,
                        borderColor: "primary.light",
                      },
                    }}
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip
                          label={endpoint.method}
                          color={getMethodColor(endpoint.method)}
                          size="small"
                          variant="filled"
                        />
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          fontWeight="medium"
                          sx={{ flexGrow: 1 }}
                        >
                          {endpoint.path}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {endpoint.summary}
                      </Typography>
                      {endpoint.tags && endpoint.tags.length > 0 && (
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {endpoint.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              color="info"
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Endpoint Tester */}
        <Box>
          {selectedEndpoint && (
            <Paper elevation={1} sx={{ borderRadius: 2 }}>
              <Box p={3}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Chip
                    label={selectedEndpoint.method}
                    color={getMethodColor(selectedEndpoint.method)}
                    size="medium"
                  />
                  <Typography variant="h6" fontFamily="monospace">
                    {selectedEndpoint.path}
                  </Typography>
                </Box>

                {selectedEndpoint.description && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    {selectedEndpoint.description}
                  </Alert>
                )}

                {/* Parameters */}
                {selectedEndpoint.parameters &&
                  selectedEndpoint.parameters.length > 0 && (
                    <Accordion sx={{ mb: 2 }}>
                      <AccordionSummary
                        expandIcon={<Icon icon="eva:arrow-ios-downward-fill" />}
                      >
                        <Typography variant="subtitle1">Parameters</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {selectedEndpoint.parameters.map(
                            (param: any, index: number) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                      >
                                        {param.name}
                                      </Typography>
                                      <Chip
                                        label={param.in}
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                      />
                                      {param.required && (
                                        <Chip
                                          label="required"
                                          size="small"
                                          color="error"
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {param.description || "No description"}
                                      {param.schema?.type &&
                                        ` (${param.schema.type})`}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ),
                          )}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                {/* Request Body */}
                {(selectedEndpoint.method === "POST" ||
                  selectedEndpoint.method === "PUT" ||
                  selectedEndpoint.method === "PATCH") && (
                  <Box mb={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Request Body (JSON)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{"key": "value"}'
                      variant="outlined"
                      InputProps={{
                        style: { fontFamily: "monospace" },
                      }}
                    />
                  </Box>
                )}

                {/* Custom Headers */}
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Custom Headers (JSON)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer token"}'
                    variant="outlined"
                    InputProps={{
                      style: { fontFamily: "monospace" },
                    }}
                  />
                </Box>

                {/* Test Button */}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Icon icon="eva:paper-plane-fill" />
                    )
                  }
                  onClick={handleTestEndpoint}
                  disabled={isLoading || !isConnected}
                  sx={{ py: 1.5 }}
                >
                  {isLoading ? "Testing..." : "Test Endpoint"}
                </Button>

                {/* Quick Response Preview */}
                {lastResponse && (
                  <Box mt={3}>
                    <Alert
                      severity={lastResponse.success ? "success" : "error"}
                      action={
                        <Button
                          size="small"
                          onClick={() => setResponseDialogOpen(true)}
                          startIcon={<Icon icon="eva:code-fill" />}
                        >
                          View Details
                        </Button>
                      }
                    >
                      <Typography variant="body2">
                        Status: {lastResponse.status} • Duration:{" "}
                        {lastResponse.duration}ms
                        {lastResponse.error && ` • ${lastResponse.error}`}
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Response Dialog */}
      <Dialog
        open={responseDialogOpen}
        onClose={() => setResponseDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Response Details</Typography>
            <IconButton onClick={() => setResponseDialogOpen(false)}>
              <Icon icon="eva:close-fill" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {lastResponse && (
            <Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={lastResponse.status}
                    color={lastResponse.success ? "success" : "error"}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {lastResponse.duration}ms
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Success
                  </Typography>
                  <Typography variant="body1">
                    {lastResponse.success ? "Yes" : "No"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body1">
                    {JSON.stringify(lastResponse.data || {}).length} bytes
                  </Typography>
                </Box>
              </Box>

              {lastResponse.error && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error
                  </Typography>
                  <Alert severity="error">{lastResponse.error}</Alert>
                </Box>
              )}

              <Typography variant="subtitle2" gutterBottom>
                Response Data
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={JSON.stringify(lastResponse.data, null, 2)}
                InputProps={{
                  readOnly: true,
                  style: { fontFamily: "monospace", fontSize: "0.875rem" },
                }}
                variant="outlined"
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={notification?.type || "info"}
          onClose={() => setNotification(null)}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
