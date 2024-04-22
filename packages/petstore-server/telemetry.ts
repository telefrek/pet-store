import { context } from "@opentelemetry/api";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "petstore-server",
    [SEMRESATTRS_SERVICE_VERSION]: "1.0.0",
  })
);

// Use the async local storage manager
context.setGlobalContextManager(new AsyncLocalStorageContextManager());

const metricReader = new PrometheusExporter({
  host: "0.0.0.0",
  port: 3001,
});

const traceExporter = new OTLPTraceExporter({
  url: "http://petstore-jaeger.default.svc:4318/v1/traces",
});

// const traceExporter = new ConsoleSpanExporter();

const sdk = new NodeSDK({
  traceExporter,
  metricReader,
  instrumentations: [],
  resource,
});

sdk.start();

// Turn on the node metrics
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerShutdown } from "@telefrek/core/lifecycle";
import {
  enableGranadaMetrics,
  enableNodeCoreMetrics,
} from "@telefrek/core/observability/metrics";
await enableNodeCoreMetrics();
enableGranadaMetrics();

registerShutdown(() => {
  sdk.shutdown();
});
