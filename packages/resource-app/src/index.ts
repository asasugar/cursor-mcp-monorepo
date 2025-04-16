import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// 初始化 MCP 服务器
const server = new McpServer({
  name: "resource-mcp-server",
  version: "1.0.0",
});

// 假设我们有一个待办事项列表
const todos = [
  { id: 1, task: "Buy groceries", completed: false },
  { id: 2, task: "Read a book", completed: true }
];

// 注册资源到服务器
server.resource(
  "todo-list",
  "todo://list",
  async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(todos, null, 2)
      }]
    };
  }
);

// 使用标准输入输出传输
const transport = new StdioServerTransport();
await server.connect(transport);
