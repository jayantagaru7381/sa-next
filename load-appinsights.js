let appInsights = require('applicationinsights');

// Only initialize if connection string is provided
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights
    .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoCollectConsole(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectHeartbeat(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectRequests(true)
    .setAutoDependencyCorrelation(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .setSendLiveMetrics(true)
    .setUseDiskRetryCaching(true);
  
  appInsights.defaultClient.setAutoPopulateAzureProperties(true);
  appInsights.start();
  
  console.log('Application Insights initialized');
} else {
  console.log('Application Insights not initialized - APPLICATIONINSIGHTS_CONNECTION_STRING not found');
}