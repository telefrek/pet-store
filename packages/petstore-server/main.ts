import {
  ConsoleLogWriter,
  LogLevel,
  setGlobalLogLevel,
  setGlobalWriter,
} from "@telefrek/core/logging.js";

// Setup the logging
const writer = new ConsoleLogWriter();
setGlobalLogLevel(LogLevel.INFO);
setGlobalWriter(writer);

import {
  httpServerBuilder,
  setHttpServerLogWriter,
} from "@telefrek/http/server.js";
import { hostFolder } from "@telefrek/http/server/hosting.js";
import {
  httpPipelineBuilder,
  setPipelineLogLevel,
  setPipelineWriter,
} from "@telefrek/http/server/pipeline.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { StoreApi } from "./api.js";
import { createOrderStore } from "./dataAccess/orders.js";

setPipelineLogLevel(LogLevel.INFO);
setPipelineWriter(writer);
setHttpServerLogWriter(writer);

const dir = path.dirname(fileURLToPath(import.meta.url));

const server = httpServerBuilder()
  .withTls({
    key: fs.readFileSync(path.join(dir, "./utils/server.key"), "utf-8"),
    cert: fs.readFileSync(path.join(dir, "./utils/server.crt"), "utf-8"),
  })
  .build();

const baseDir = process.env.UI_PATH ?? path.join(dir, "../petstore-ui/build");

const orderStore = createOrderStore();

const pipeline = httpPipelineBuilder(server)
  .withDefaults()
  .withTransforms(
    hostFolder({
      baseDir,
      level: LogLevel.DEBUG,
      writer: new ConsoleLogWriter(),
      name: "Petstore Hosting",
    })
  )
  .withApi(new StoreApi(orderStore))
  .build();

// Wait for the end...
await server.listen(3000);
await pipeline.stop();
orderStore.close();
