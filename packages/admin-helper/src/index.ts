import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';
import { z } from 'zod';

const args = process.argv.slice(2);

// Find specific arguments
// const translateApiKeyIndex = args.indexOf('--difyTranslateApiKey');
const apiKeyIndex = args.indexOf('--difyApiKey');
const apiUrlIndex = args.indexOf('--difyApiUrl');

// const DIFY_TRANSLATE_API_KEY = translateApiKeyIndex !== -1 ? args[translateApiKeyIndex + 1] : null;
const DIFY_API_KEY = apiKeyIndex !== -1 ? args[apiKeyIndex + 1] : null;
const DIFY_API_URL = apiUrlIndex !== -1 ? args[apiUrlIndex + 1] : null;

// Initialize MCP Server
const server = new McpServer({
  name: "admin-helper-mcp-server",
  version: "1.0.0",
});

// Dify API configuration

if (!DIFY_API_KEY || !DIFY_API_URL) {
  console.error('DIFY_API_KEY or DIFY_API_URL is not set in environment variables');
  process.exit(1);
}

// Define the tool logic
const adminHelperTool = async ({ text, }: { text: string; }) => {

  const headers = {
    "Authorization": `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json"
  };
  const payload = {
    "inputs": {},
    "query": text,
    "response_mode": "blocking",
    "user": "user123"
  };

  const response = await axios.post(DIFY_API_URL, payload, { headers });
  const result = response.data;

  return {
    content: [{
      type: "text",
      text: result.answer || ""
    }]
  };
};

// Register the tool with the MCP server
server.tool(
  "adminHelper",
  { text: z.string() },
  async ({ text }) => {

    const result = await adminHelperTool({ text });

    return {
      content: result.content.map(item => ({
        type: "text" as const,
        text: String(item.text)
      }))
    };
  }
);


const transport = new StdioServerTransport();
await server.connect(transport);