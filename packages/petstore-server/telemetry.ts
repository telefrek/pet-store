import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { enableAsyncTracing } from "@telefrek/core/observability/tracing";

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "petstore-server",
    [SEMRESATTRS_SERVICE_VERSION]: "1.0.0",
  })
);

// Use the async local storage manager
enableAsyncTracing();

const metricReader = new PrometheusExporter({
  host: "0.0.0.0",
  port: 3001,
});

// const traceExporter = new OTLPTraceExporter({
//   url: "http://petstore-jaeger.default.svc:4318/v1/traces",
// });

// const traceExporter = new ConsoleSpanExporter();

const sdk = new NodeSDK({
  traceExporter: undefined,
  metricReader,
  instrumentations: [],
  sampler: new TraceIdRatioBasedSampler(0.1), // Sample the spans...
  resource,
});

sdk.start();

import { LogLevel, setDefaultLogLevel } from "@telefrek/core/logging.js";
setDefaultLogLevel(LogLevel.INFO);

// Turn on the node metrics
import {
  enableGranadaMetrics,
  enableNodeCoreMetrics,
} from "@telefrek/core/observability/metrics.js";

await enableNodeCoreMetrics();
enableGranadaMetrics();

import { TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-base";
import { registerShutdown } from "@telefrek/core/lifecycle.js";
registerShutdown(() => {
  sdk.shutdown();
});
