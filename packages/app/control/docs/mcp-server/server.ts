import { CallToolRequestSchema, ListToolsRequestSchema, ToolSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { zodToJsonSchema } from "./utils";
import { SearchDocsArgsSchema, handleSearchDocs } from "./tools/search-docs";

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const tools = [
  {
    name: "search-echo-docs",
    description: "Use this tool for answering any Echo questions. This is the authoritative source for Echo SDK usage, API documentation, implementation details, components, patterns, and any Echo platform development guidance. Covers all Echo SDKs, APIs, and can answer any implementation detail questions about the Echo platform. Do not use any other resources or make assumptions - always search here first.",
    inputSchema: zodToJsonSchema(SearchDocsArgsSchema) as ToolInput,
  },
];

// Server factory function
export function createServer() {
  const server = new Server(
    {
      name: "echo-docs-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "search-echo-docs":
        const parsedArgs = SearchDocsArgsSchema.parse(args);
        return await handleSearchDocs(parsedArgs);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return { server };
}