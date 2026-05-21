import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';

import { infographicWorkflow } from './workflows/infographic-workflow';
import {
  contentAgent,
  styleAgent,
  styleFromTextAgent,
  criticAgent,
  formatterAgent,
  topicContentAgent,
} from './agents/infographic-agent';
import { scrapeWebsiteTool } from './tools/scraper';
import { graphifyContextTool } from './tools/graphify-context';
import { imageGeneratorTool } from './tools/image-generator';

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
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: "file:./mastra.db",
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), 
          new CloudExporter(), 
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), 
        ],
      },
    },
  }),
});