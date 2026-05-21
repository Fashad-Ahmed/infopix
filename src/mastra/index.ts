import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { MastraCompositeStore } from "@mastra/core/storage";
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from "@mastra/observability";

import { infographicWorkflow } from "./workflows/infographic-workflow";
import {
  contentAgent,
  styleAgent,
  styleFromTextAgent,
  criticAgent,
  formatterAgent,
  topicContentAgent,
} from "./agents/infographic-agent";
import { scrapeWebsiteTool } from "./tools/scraper";
import { graphifyContextTool } from "./tools/graphify-context";
import { imageGeneratorTool } from "./tools/image-generator";

const isProd = process.env.NODE_ENV === "production";
const tursoUrl = process.env.TURSO_DATABASE_URL;

if (isProd && !tursoUrl) {
  throw new Error(
    "TURSO_DATABASE_URL is required in production. Run `turso db create` and set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.",
  );
}

const defaultStore = new LibSQLStore({
  id: "mastra-storage",
  url: tursoUrl ?? "file:./mastra.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// DuckDB is a native module — incompatible with Vercel serverless.
// Only enable locally for Mastra Studio observability.
const observabilityDomain = isProd
  ? undefined
  : await (async () => {
      const { DuckDBStore } = await import("@mastra/duckdb");
      return new DuckDBStore().getStore("observability");
    })();

export const mastra = new Mastra({
  workflows: { infographicWorkflow },
  agents: {
    contentAgent,
    styleAgent,
    styleFromTextAgent,
    criticAgent,
    formatterAgent,
    topicContentAgent,
  },
  tools: { scrapeWebsiteTool, graphifyContextTool, imageGeneratorTool },

  storage: new MastraCompositeStore({
    id: "composite-storage",
    default: defaultStore,
    domains: observabilityDomain
      ? { observability: observabilityDomain }
      : {},
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [new DefaultExporter(), new CloudExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
