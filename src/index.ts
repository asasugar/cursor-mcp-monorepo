import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { TodoItem } from "./types/index.d.ts";

// Initialize an empty array to store todo items in memory
const todos: TodoItem[] = [];
let nextId = 1;
// Create an MCP server instance
const server = new McpServer({
  name: "todo-mcp-server",
  version: "1.0.0",
});

// Define a resource to return the entire todo list
server.resource(
  "todo-list",
  "todo://list",
  async (uri) => {
    // Return the todo list as a JSON string
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(todos, null, 2)
      }]
    };
  }
);
// Define a tool to add a new todo item
server.tool(
  "addTodo",
  { text: z.string() },
  async ({ text }) => {
    const newTask: TodoItem = { id: nextId++, text: String(text), done: false };
    todos.push(newTask);
    return {
      content: [{
        type: "text",
        text: `AddTodo (ID=${newTask.id}): "${newTask.text}"`
      }]
    };
  }
);
// Define a tool to mark a todo item as complete
server.tool(
  "completeTodo",
  { id: z.number() },
  async ({ id }) => {
    // Find the todo item by ID and mark it as done
    const task = todos.find(t => t.id === id);
    if (!task) {
      return {
        content: [{ type: "text", text: `Görev bulunamadı: ID=${id}` }]
      };
    }
    task.done = true;
    return {
      content: [{
        type: "text",
        text: `Todo completed: "${task.text}" (ID=${task.id})`
      }]
    };
  }
);

// Define a tool to get the entire todo list
server.tool(
  "getTodo",
  { },
  async () => {

    return {
      content: todos.map(todo => ({
        type: "text",
        text: `Todo list: ID: ${todo.id}, Text: "${todo.text}", Done: ${todo.done}`
      }))
    };
  }
);

console.error("📡 MCP server started. Waiting for client connection...");
const transport = new StdioServerTransport();
await server.connect(transport);