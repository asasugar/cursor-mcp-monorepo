import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from 'fs/promises';
// File path for storing todos
const TODO_FILE_PATH = new URL('../todos.json', import.meta.url);
async function accessFile(filePath) {
    try {
        await fs.access(filePath);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            try {
                await fs.writeFile(TODO_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
            }
            catch (writeError) {
                console.error('Error create file:', writeError);
            }
        }
        else {
            console.error("Error access file:", error);
        }
    }
}
// Function to load todos from a file
async function loadTodos() {
    try {
        await accessFile(TODO_FILE_PATH);
        const data = await fs.readFile(TODO_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error("Error loading todos from file:", error);
        return [];
    }
}
// Function to save todos to a file
async function saveTodos(todos) {
    try {
        await accessFile(TODO_FILE_PATH);
        await fs.writeFile(TODO_FILE_PATH, JSON.stringify(todos, null, 2), 'utf-8');
    }
    catch (error) {
        console.error("Error saving todos to file:", error);
    }
}
// Initialize an empty array to store todo items in memory
const todos = await loadTodos();
let nextId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
// Create an MCP server instance
const server = new McpServer({
    name: "todo-mcp-server",
    version: "1.0.0",
});
// Define a tool to add a new todo item
server.tool("addTodo", { text: z.string() }, async ({ text }) => {
    // 确保获取到最新的 todos
    const todos = await loadTodos();
    let nextId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
    const newTask = { id: nextId++, text: String(text), done: false };
    todos.push(newTask);
    await saveTodos(todos);
    return {
        content: [{
                type: "text",
                text: `AddTodo (ID=${newTask.id}): "${newTask.text}"`
            }]
    };
});
// Define a tool to mark a todo item as complete
server.tool("completeTodo", { id: z.number() }, async ({ id }) => {
    // Find the todo item by ID and mark it as done
    const task = todos.find(t => t.id === id);
    if (!task) {
        return {
            content: [{ type: "text", text: `Task not found: ID=${id}` }]
        };
    }
    task.done = true;
    await saveTodos(todos);
    return {
        content: [{
                type: "text",
                text: `Todo completed: "${task.text}" (ID=${task.id})`
            }]
    };
});
// Define a tool to get the entire todo list
server.tool("getTodoList", {}, async ({}) => {
    try {
        // 确保获取到最新的 todos
        const todos = await loadTodos();
        return {
            content: todos.map(todo => ({
                type: "text",
                text: `Todo list: ID: ${todo.id}, Text: \"${todo.text}\", Done: ${todo.done}`
            }))
        };
    }
    catch (error) {
        console.error("Error retrieving todo list:", error);
        return {
            content: [{ type: "text", text: "Error retrieving todo list." }]
        };
    }
});
// Define a tool to clear the entire todo list
server.tool("clearTodo", {}, async ({}) => {
    try {
        todos.length = 0;
        await saveTodos(todos);
        return {
            content: [{
                    type: "text",
                    text: `Todo list cleared.`
                }]
        };
    }
    catch (error) {
        console.error("Error retrieving todo list:", error);
        return {
            content: [{ type: "text", text: "Error clearing todo list." }]
        };
    }
});
console.log("📡 MCP server started. ");
const transport = new StdioServerTransport();
await server.connect(transport);
