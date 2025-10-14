"use client";

import { Icon } from "@iconify/react";
import React, { useMemo, useState } from "react";

import {
  Box,
  Tab,
  Card,
  Chip,
  List,
  Tabs,
  Paper,
  Alert,
  Table,
  Button,
  TableRow,
  ListItem,
  useTheme,
  Accordion,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CardContent,
  ListItemText,
  useMediaQuery,
  TableContainer,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from "@mui/material";

interface OpenAPIExplorerProps {
  schema: any;
  onRefresh: () => Promise<void>;
}

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
      id={`schema-tabpanel-${index}`}
      aria-labelledby={`schema-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const OpenAPIExplorer: React.FC<OpenAPIExplorerProps> = ({
  schema,
  onRefresh,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(
    new Set(),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleAccordion = (panelId: string) => {
    const newExpanded = new Set(expandedAccordions);
    if (newExpanded.has(panelId)) {
      newExpanded.delete(panelId);
    } else {
      newExpanded.add(panelId);
    }
    setExpandedAccordions(newExpanded);
  };

  const downloadSchema = () => {
    if (!schema) return;

    const dataStr = JSON.stringify(schema, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "openapi-schema.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const schemaStats = useMemo(() => {
    if (!schema) return null;

    const paths = Object.keys(schema.paths || {});
    const endpoints = paths.reduce(
      (acc, path) => acc + Object.keys(schema.paths[path] || {}).length,
      0,
    );

    const methods = new Set<string>();
    const tags = new Set<string>();

    paths.forEach((path) => {
      Object.entries(schema.paths[path] || {}).forEach(
        ([method, methodData]: [string, any]) => {
          methods.add(method.toUpperCase());
          if (methodData.tags) {
            methodData.tags.forEach((tag: string) => tags.add(tag));
          }
        },
      );
    });

    const components = schema.components || {};
    const schemas = Object.keys(components.schemas || {}).length;
    const securitySchemes = Object.keys(
      components.securitySchemes || {},
    ).length;

    return {
      totalPaths: paths.length,
      totalEndpoints: endpoints,
      methods: Array.from(methods),
      tags: Array.from(tags),
      schemas,
      securitySchemes,
    };
  }, [schema]);

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
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

  if (!schema) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          No API Schema Available
        </Typography>
        <Typography>
          Connect to the API and load the schema to explore available endpoints
          and documentation.
        </Typography>
        <Box mt={2}>
          <Button
            variant="contained"
            startIcon={
              isRefreshing ? (
                <CircularProgress size={16} />
              ) : (
                <Icon icon="eva:refresh-fill" />
              )
            }
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Load Schema
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isMobile ? "flex-start" : "center"}
          gap={2}
        >
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              API Schema Explorer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {schema.info?.title}{" "}
              {schema.info?.version && `v${schema.info.version}`}
            </Typography>
            {schema.info?.description && (
              <Typography variant="body2" color="text.secondary">
                {schema.info.description}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Icon icon="eva:download-fill" />}
              onClick={downloadSchema}
              size={isMobile ? "small" : "medium"}
            >
              Download
            </Button>
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
              size={isMobile ? "small" : "medium"}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      {schemaStats && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Icon
                  icon="eva:globe-fill"
                  color={theme.palette.primary.main}
                  width={32}
                  style={{ marginBottom: 8 }}
                />
                <Typography variant="h5" fontWeight="bold">
                  {schemaStats.totalEndpoints}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Endpoints
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Icon
                  icon="eva:code-fill"
                  color={theme.palette.info.main}
                  width={32}
                  style={{ marginBottom: 8 }}
                />
                <Typography variant="h5" fontWeight="bold">
                  {schemaStats.schemas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Schemas
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Icon
                  icon="eva:info-fill"
                  color={theme.palette.warning.main}
                  width={32}
                  style={{ marginBottom: 8 }}
                />
                <Typography variant="h5" fontWeight="bold">
                  {schemaStats.tags.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tags
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Icon
                  icon="eva:shield-fill"
                  color={theme.palette.error.main}
                  width={32}
                  style={{ marginBottom: 8 }}
                />
                <Typography variant="h5" fontWeight="bold">
                  {schemaStats.securitySchemes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Security
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Tabs */}
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label="Endpoints"
            icon={<Icon icon="eva:globe-fill" width={20} />}
            iconPosition="start"
          />
          <Tab
            label="Schemas"
            icon={<Icon icon="eva:code-fill" width={20} />}
            iconPosition="start"
          />
          <Tab
            label="Info"
            icon={<Icon icon="eva:info-fill" width={20} />}
            iconPosition="start"
          />
          <Tab
            label="Raw Schema"
            icon={<Icon icon="eva:code-download-fill" width={20} />}
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {/* Endpoints Tab */}
          <Box>
            {Object.entries(schema.paths || {}).map(
              ([path, pathData]: [string, any]) => (
                <Accordion
                  key={path}
                  expanded={expandedAccordions.has(path)}
                  onChange={() => toggleAccordion(path)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary
                    expandIcon={<Icon icon="eva:arrow-ios-downward-fill" />}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      width="100%"
                    >
                      <Typography
                        variant="h6"
                        fontFamily="monospace"
                        sx={{ flexGrow: 1 }}
                      >
                        {path}
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        {Object.keys(pathData).map((method) => (
                          <Chip
                            key={method}
                            label={method.toUpperCase()}
                            size="small"
                            color={getMethodColor(method)}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {Object.entries(pathData).map(
                      ([method, methodData]: [string, any]) => (
                        <Card key={method} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={2}
                            >
                              <Chip
                                label={method.toUpperCase()}
                                color={getMethodColor(method)}
                                size="small"
                              />
                              <Typography
                                variant="subtitle1"
                                fontWeight="medium"
                              >
                                {methodData.summary ||
                                  `${method.toUpperCase()} ${path}`}
                              </Typography>
                            </Box>

                            {methodData.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                              >
                                {methodData.description}
                              </Typography>
                            )}

                            {methodData.tags && methodData.tags.length > 0 && (
                              <Box display="flex" gap={0.5} mb={2}>
                                {methodData.tags.map((tag: string) => (
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

                            {methodData.parameters &&
                              methodData.parameters.length > 0 && (
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Parameters
                                  </Typography>
                                  <TableContainer>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Name</TableCell>
                                          <TableCell>In</TableCell>
                                          <TableCell>Type</TableCell>
                                          <TableCell>Required</TableCell>
                                          <TableCell>Description</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {methodData.parameters.map(
                                          (param: any, index: number) => (
                                            <TableRow key={index}>
                                              <TableCell>
                                                <Typography
                                                  variant="body2"
                                                  fontFamily="monospace"
                                                >
                                                  {param.name}
                                                </Typography>
                                              </TableCell>
                                              <TableCell>
                                                <Chip
                                                  label={param.in}
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Typography variant="body2">
                                                  {param.schema?.type ||
                                                    param.type ||
                                                    "unknown"}
                                                </Typography>
                                              </TableCell>
                                              <TableCell>
                                                <Chip
                                                  label={
                                                    param.required
                                                      ? "Yes"
                                                      : "No"
                                                  }
                                                  size="small"
                                                  color={
                                                    param.required
                                                      ? "error"
                                                      : "default"
                                                  }
                                                  variant="outlined"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Typography variant="body2">
                                                  {param.description ||
                                                    "No description"}
                                                </Typography>
                                              </TableCell>
                                            </TableRow>
                                          ),
                                        )}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Box>
                              )}

                            {methodData.responses && (
                              <Box mt={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Responses
                                </Typography>
                                <List dense>
                                  {Object.entries(methodData.responses).map(
                                    ([code, response]: [string, any]) => (
                                      <ListItem key={code} divider>
                                        <ListItemText
                                          primary={
                                            <Box
                                              display="flex"
                                              alignItems="center"
                                              gap={1}
                                            >
                                              <Chip
                                                label={code}
                                                size="small"
                                                color={
                                                  code.startsWith("2")
                                                    ? "success"
                                                    : code.startsWith("4")
                                                      ? "warning"
                                                      : "error"
                                                }
                                              />
                                              <Typography variant="body2">
                                                {response.description ||
                                                  "No description"}
                                              </Typography>
                                            </Box>
                                          }
                                        />
                                      </ListItem>
                                    ),
                                  )}
                                </List>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ),
                    )}
                  </AccordionDetails>
                </Accordion>
              ),
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Schemas Tab */}
          <Box>
            {schema.components?.schemas ? (
              Object.entries(schema.components.schemas).map(
                ([schemaName, schemaData]: [string, any]) => (
                  <Accordion key={schemaName} sx={{ mb: 1 }}>
                    <AccordionSummary
                      expandIcon={<Icon icon="eva:arrow-ios-downward-fill" />}
                    >
                      <Typography variant="h6" fontFamily="monospace">
                        {schemaName}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={JSON.stringify(schemaData, null, 2)}
                        InputProps={{
                          readOnly: true,
                          style: {
                            fontFamily: "monospace",
                            fontSize: "0.875rem",
                          },
                        }}
                        variant="outlined"
                      />
                    </AccordionDetails>
                  </Accordion>
                ),
              )
            ) : (
              <Alert severity="info">No schemas defined in this API.</Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* Info Tab */}
          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <Box>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      API Information
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Title"
                          secondary={schema.info?.title || "Not specified"}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Version"
                          secondary={schema.info?.version || "Not specified"}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="OpenAPI Version"
                          secondary={schema.openapi || "Not specified"}
                        />
                      </ListItem>
                      {schema.info?.contact && (
                        <ListItem>
                          <ListItemText
                            primary="Contact"
                            secondary={
                              schema.info.contact.email ||
                              schema.info.contact.name ||
                              "Available"
                            }
                          />
                        </ListItem>
                      )}
                      {schema.info?.license && (
                        <ListItem>
                          <ListItemText
                            primary="License"
                            secondary={schema.info.license.name || "Available"}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Box>

              <Box>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Server Information
                    </Typography>
                    {schema.servers && schema.servers.length > 0 ? (
                      <List>
                        {schema.servers.map((server: any, index: number) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={server.url}
                              secondary={server.description || "No description"}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No server information available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {schemaStats && schemaStats.tags.length > 0 && (
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Available Tags
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {schemaStats.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {/* Raw Schema Tab */}
          <TextField
            fullWidth
            multiline
            rows={20}
            value={JSON.stringify(schema, null, 2)}
            InputProps={{
              readOnly: true,
              style: { fontFamily: "monospace", fontSize: "0.875rem" },
            }}
            variant="outlined"
          />
        </TabPanel>
      </Paper>
    </Box>
  );
};
