import {
  checkDanglingResources,
  registerShutdown,
} from "@telefrek/core/lifecycle";
import { info } from "@telefrek/core/logging";
import { Duration } from "@telefrek/core/time";
import { type HttpPipelineConfiguration } from "@telefrek/http/pipeline";
import { hostFolder } from "@telefrek/http/pipeline/hosting";
import { createLoadSheddingTransform } from "@telefrek/http/pipeline/loadShedding";
import { NodeHttp2Server } from "@telefrek/http/server/http2";
import { DEFAULT_SERVER_PIPELINE_CONFIGURATION } from "@telefrek/http/server/pipeline";
import { ServicePipelineBuilder } from "@telefrek/service/util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { StoreApi } from "./api.js";
import { createOrderStore } from "./dataAccess/orders.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

const server = new NodeHttp2Server({
  name: "PetStore",
  tls: {
    privateKey: fs.readFileSync(path.join(dir, "./utils/server.key"), "utf-8"),
    publicCertificate: fs.readFileSync(
      path.join(dir, "./utils/server.crt"),
      "utf-8"
    ),
  },
  requestTimeout: Duration.ofSeconds(2),
});

const baseDir = process.env.UI_PATH ?? path.join(dir, "../petstore-ui/build");

const orderStore = createOrderStore();

const config: HttpPipelineConfiguration = {
  ...DEFAULT_SERVER_PIPELINE_CONFIGURATION,
};

const transforms = config.transforms ?? [];

transforms.push(
  hostFolder({
    baseDir,
  })
);

transforms.push(
  createLoadSheddingTransform({
    maxOutstandingRequests: 8,
    thresholdMs: 15,
  })
);

const pipeline = new ServicePipelineBuilder(server, config)
  .withApi(new StoreApi(orderStore))
  .run(3000, {
    maxConcurrency: 8,
  });

registerShutdown(() => {
  server.close(false);
});

// Wait for the end...
await pipeline;
info("closing store...");
await orderStore.close();
info("store closed");

// Kill any dangling resources...
checkDanglingResources(true);
