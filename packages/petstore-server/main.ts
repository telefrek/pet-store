import "./telemetry.js";

import { CONTENT_PARSING_TRANSFORM } from "@telefrek/http/parsers";
import { getDefaultBuilder } from "@telefrek/http/server";
import { hostFolder } from "@telefrek/http/server/hosting";
import { createPipeline } from "@telefrek/http/server/pipeline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { StoreApi } from "./api.js";
import { createOrderStore } from "./dataAccess/orders.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

const server = getDefaultBuilder()
  .withTls({
    key: fs.readFileSync(path.join(dir, "./utils/server.key"), "utf-8"),
    cert: fs.readFileSync(path.join(dir, "./utils/server.crt"), "utf-8"),
  })
  .build();

const ui_path = process.env.UI_PATH ?? "../petstore-ui/build";

const pipeline = createPipeline(server)
  .withContentHosting(hostFolder(path.join(dir, ui_path)))
  .withApi(new StoreApi(createOrderStore()))
  .withContentParsing(CONTENT_PARSING_TRANSFORM)
  .build();

process.on("SIGINT", () => {
  console.log("received SIGINT, closing");
  void pipeline.stop();
  void server.close();
});

// Wait for the end...
void server.listen(3000);
