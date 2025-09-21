#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import express, { Request, Response } from "express";
import { randomUUID } from 'node:crypto';
import cors from 'cors';

// Schema for addition tool
const AdditionArgsSchema = z.object({
  a: z.number().describe('First number to add'),
  b: z.number().describe('Second number to add')
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Helper function to convert Zod schema to JSON schema
function zodToJsonSchema(schema: z.ZodType<any>): any {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: any = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(shape)) {
      if (value instanceof z.ZodNumber) {
        properties[key] = { type: "number" };
        if (value.description) {
          properties[key].description = value.description;
        }
      }
      if (!value.isOptional()) {
        required.push(key);
      }
    }
    
    return {
      type: "object",
      properties,
      required
    };
  }
  return {};
}

// Server factory function
function createServer() {
  const server = new Server(
    {
      name: "simple-addition-server",
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
      tools: [
        {
          name: "add",
          description: "Add two numbers together and return the result.",
          inputSchema: zodToJsonSchema(AdditionArgsSchema) as ToolInput,
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.error('CallTool request received:', JSON.stringify(request.params, null, 2));
    try {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "add": {
          console.error('Processing add tool with args:', args);
          const parsed = AdditionArgsSchema.safeParse(args);
          if (!parsed.success) {
            console.error('Validation failed:', parsed.error);
            throw new Error(`Invalid arguments for add: ${parsed.error}`);
          }
          
          const result = parsed.data.a + parsed.data.b;
          const response = {
            content: [{ type: "text", text: `${parsed.data.a} + ${parsed.data.b} = ${result}` }],
          };
          console.error('Returning response:', response);
          return response;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in tool handler:', errorMessage);
      return {
        content: [{ type: "text", text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  const cleanup = async () => {
    // Cleanup logic if needed
  };

  const startNotificationIntervals = (sessionId: string | undefined) => {
    // Start any notification intervals if needed
  };

  return { server, cleanup, startNotificationIntervals };
}

console.error('Starting Streamable HTTP server...');

const app = express();
app.use(cors({
    "origin": "*", // use "*" with caution in production
    "methods": "GET,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204,
    "exposedHeaders": [
        'mcp-session-id',
        'last-event-id',
        'mcp-protocol-version'
    ]
})); // Enable CORS for all routes so Inspector can connect

interface SessionInfo {
  transport: StreamableHTTPServerTransport;
  server: any;
  cleanup: () => Promise<void>;
}

const sessions: Map<string, SessionInfo> = new Map<string, SessionInfo>();

app.post('/mcp', async (req: Request, res: Response) => {
  console.error('Received MCP POST request');
  try {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && sessions.has(sessionId)) {
      // Reuse existing session
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
      return;
    } else if (!sessionId) {
      // New initialization request
      const { server, cleanup, startNotificationIntervals } = createServer();
      
      const eventStore = new InMemoryEventStore();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore, // Enable resumability
        onsessioninitialized: (sessionId: string) => {
          // Store the session info when session is initialized
          console.error(`Session initialized with ID: ${sessionId}`);
          sessions.set(sessionId, { transport, server, cleanup });
        }
      });

      // Set up onclose handler to clean up session when closed
      server.onclose = async () => {
        const sid = transport.sessionId;
        if (sid && sessions.has(sid)) {
          console.error(`Session closed for session ${sid}, removing from sessions map`);
          const session = sessions.get(sid)!;
          sessions.delete(sid);
          await session.cleanup();
        }
      };

      // Connect the transport to the MCP server BEFORE handling the request
      await server.connect(transport);

      await transport.handleRequest(req, res);

      // Start notification intervals after initialization
      startNotificationIntervals(transport.sessionId);
      return;
    } else {
      // Invalid request - session ID provided but not found
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Session not found or invalid',
        },
        id: req?.body?.id,
      });
      return;
    }
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: req?.body?.id,
      });
    }
  }
});

// Handle GET requests for SSE streams (using built-in support from StreamableHTTP)
app.get('/mcp', async (req: Request, res: Response) => {
  console.error('Received MCP GET request');
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: req?.body?.id,
    });
    return;
  }

  // Check for Last-Event-ID header for resumability
  const lastEventId = req.headers['last-event-id'] as string | undefined;
  if (lastEventId) {
    console.error(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
  } else {
    console.error(`Establishing new SSE stream for session ${sessionId}`);
  }

  const session = sessions.get(sessionId)!;
  await session.transport.handleRequest(req, res);
});

// Handle DELETE requests for session termination (according to MCP spec)
app.delete('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: req?.body?.id,
    });
    return;
  }

  console.error(`Received session termination request for session ${sessionId}`);

  try {
    const transport = sessions.get(sessionId)!.transport;
    await transport!.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Error handling session termination',
        },
        id: req?.body?.id,
      });
      return;
    }
  }
});

// Start the server
const PORT = process.env.PORT || 3059;
app.listen(PORT, () => {
  console.error(`Simple Addition MCP Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down server...');

  // Close all active sessions to properly clean up resources
  for (const [sessionId, session] of sessions) {
    try {
      console.error(`Closing session ${sessionId}`);
      await session.transport.close();
      await session.cleanup();
      sessions.delete(sessionId);
    } catch (error) {
      console.error(`Error closing session ${sessionId}:`, error);
    }
  }

  console.error('Server shutdown complete');
  process.exit(0);
});