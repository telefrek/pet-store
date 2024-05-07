import { registerShutdown } from "@telefrek/core/lifecycle";
import { type HttpPipelineConfiguration } from "@telefrek/http/pipeline";
import { hostFolder } from "@telefrek/http/pipeline/hosting";
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
});

const baseDir = process.env.UI_PATH ?? path.join(dir, "../petstore-ui/build");

const orderStore = createOrderStore();

const config: HttpPipelineConfiguration = {
  ...DEFAULT_SERVER_PIPELINE_CONFIGURATION,
};

config.requestTransforms!.push(
  hostFolder({
    baseDir,
  })
);

const pipeline = new ServicePipelineBuilder(server, config)
  .withApi(new StoreApi(orderStore))
  .run(3000);

registerShutdown(() => {
  server.close(false);
});

// Wait for the end...
await pipeline;
orderStore.close();
