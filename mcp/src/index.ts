#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerTranscribeFileTool } from './tools/transcribeFile.js';
import { registerTranscribeLiveTool } from './tools/transcribeLive.js';
import { registerGetBalanceTool } from './tools/getBalance.js';
import { registerTopUpTool } from './tools/topUp.js';
import { registerSaveTranscriptTool } from './tools/saveTranscript.js';

const server = new McpServer({
  name: 'scribetogo',
  version: '1.0.0',
});

registerTranscribeFileTool(server);
registerTranscribeLiveTool(server);
registerGetBalanceTool(server);
registerTopUpTool(server);
registerSaveTranscriptTool(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[scribetogo-mcp] Server running on stdio');
}

main().catch((err) => {
  console.error('[scribetogo-mcp] Fatal error:', err);
  process.exit(1);
});
