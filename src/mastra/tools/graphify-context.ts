import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

interface GraphNode {
  id: string;
  label: string;
  file_type: string;
  source_file: string;
  source_location: string;
  community: number;
  norm_label: string;
}

interface GraphLink {
  source: string;
  target: string;
  relation: string;
  confidence: string;
  weight: number;
  confidence_score: number;
  source_file?: string;
  source_location?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const graphifyContextTool = createTool({
  id: "graphify-context",
  description:
    "Fetches related code context from the Graphify knowledge graph for a given file path. Returns related files, symbols, and relationships to provide broader codebase understanding.",
  inputSchema: z.object({
    filePath: z.string().describe("The relative file path to get context for (e.g., 'src/components/Infographic.tsx')"),
  }),

  execute: async ({ filePath }) => {
    try {
      const graphPath = path.join(process.cwd(), "graphify-out", "graph.json");

      if (!fs.existsSync(graphPath)) {
        return {
          error: "Graphify output not found. Run 'npx graphify .' first to generate the knowledge graph.",
        };
      }

      const graphData: GraphData = JSON.parse(fs.readFileSync(graphPath, "utf-8"));

      // Find nodes for the given file
      const fileNodes = graphData.nodes.filter(node => node.source_file === filePath);

      if (fileNodes.length === 0) {
        return {
          error: `No nodes found for file: ${filePath}`,
        };
      }

      // Find all connected nodes via links
      const connectedNodeIds = new Set<string>();
      const relevantLinks: GraphLink[] = [];

      fileNodes.forEach(node => {
        connectedNodeIds.add(node.id);

        // Find links where this node is source or target
        graphData.links.forEach(link => {
          if (link.source === node.id || link.target === node.id) {
            relevantLinks.push(link);
            connectedNodeIds.add(link.source);
            connectedNodeIds.add(link.target);
          }
        });
      });

      // Get unique connected nodes
      const connectedNodes = graphData.nodes.filter(node => connectedNodeIds.has(node.id));

      // Group by file
      const files = [...new Set(connectedNodes.map(node => node.source_file))];

      // Group symbols by file
      const symbolsByFile: Record<string, string[]> = {};
      connectedNodes.forEach(node => {
        if (!symbolsByFile[node.source_file]) {
          symbolsByFile[node.source_file] = [];
        }
        symbolsByFile[node.source_file].push(node.label);
      });

      // Get relationships
      const relationships = relevantLinks.map(link => ({
        from: graphData.nodes.find(n => n.id === link.source)?.label || link.source,
        to: graphData.nodes.find(n => n.id === link.target)?.label || link.target,
        relation: link.relation,
        confidence: link.confidence,
      }));

      return {
        filePath,
        relatedFiles: files.filter(f => f !== filePath),
        symbolsInFile: symbolsByFile[filePath] || [],
        relatedSymbols: Object.entries(symbolsByFile)
          .filter(([f]) => f !== filePath)
          .flatMap(([file, symbols]) => symbols.map(s => `${file}: ${s}`)),
        relationships: relationships.slice(0, 20), // Limit to prevent too much output
        community: fileNodes[0]?.community,
      };
    } catch (error) {
      return {
        error: `Failed to load Graphify context: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});