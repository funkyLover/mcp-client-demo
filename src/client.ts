// from https://modelcontextprotocol.io/quickstart/client#node
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

// https://github.com/leartbeqiraj1/openai-mcp-client/blob/main/client-with-openai.js

dotenv.config();

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY is not set");
}

class MCPClient {
  // mcp client实例
  private mcp: Client;
  // 大模型实例, 文档使用的anthropic, 这里我用的openai的sdk, 实际使用qwen模型
  private openai: OpenAI;
  // 标准输入输出 transport
  private transport: StdioClientTransport | null = null;
  // 记录 mcp server 提供的tools
  private tools: any[] = [];

  constructor() {
    // 先初始化大模型client和mcp client
    this.openai = new OpenAI({
      apiKey: API_KEY,
      baseURL: process.env.BASE_URL,
    });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }

  // 连接 mcp server, 入参 mcp server 脚本入口
  async connectToServer(serverScriptPath: string) {
    try {
      const isJs = serverScriptPath.endsWith(".js");
      const isPy = serverScriptPath.endsWith(".py");
      if (!isJs && !isPy) {
        throw new Error("Server script must be a .js or .py file");
      }
      const command = isPy
        ? process.platform === "win32"
          ? "python"
          : "python3"
        : process.execPath;

      // 文档实例使用标准输入输出来作为 transport
      // 所以会在client进程中通过子进程启动server, 然后通过stdio通信
      this.transport = new StdioClientTransport({
        command,
        args: [serverScriptPath],
      });
      // client 连接到 transport
      this.mcp.connect(this.transport);
      // 获取 mcp 服务 tools 列表
      const toolsResult = await this.mcp.listTools();
      // 文档实例使用 anthropic, toolList可以直接传递给大模型client
      // 我这里使用openai sdk, 所以需要做一层转化
      // adapter 方法来自 https://github.com/leartbeqiraj1/openai-mcp-client/blob/main/adapter.js
      this.tools = toolsResult.tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description?.slice(0, 1024),
          parameters: tool.inputSchema,
          strict: false,
        },
      }));

      console.log(
        "Connected to server with tools:",
        this.tools.map((v) => v.function.name)
      );
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  // 大模型对话入口
  async processQuery(query: string) {
    // 对话入参
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "user",
        content: query,
      },
    ];

    // 使用qwen, 把问题和tools都传递进去
    const response = await this.openai.chat.completions.create({
      model: process.env.MODEL as string,
      messages: messages,
      tools: this.tools,
    });

    const finalText = [];

    for (const choice of response.choices) {
      if (!choice?.message?.tool_calls) {
        // 如果响应数据是不tools_calls, 即不需要触发mcp服务调用, 直接处理响应文本即可
        finalText.push(choice?.message?.content);
      } else if (choice?.message?.tool_calls) {
        // 如果是tools_calls, 即需要触发mcp服务调用
        const toolCalls = choice.message.tool_calls;
        const results = await Promise.all(
          toolCalls.map(async (toolCall: any) => {
            // 记录一下调用结果, 方便debug
            finalText.push(
              `[Calling tool ${toolCall.function.name} with args ${JSON.stringify(toolCall.function.arguments)}]`
            );
            return await this.mcp.callTool(
              {
                name: toolCall.function.name,
                arguments: JSON.parse(toolCall.function.arguments),
              },
              CallToolResultSchema
            );
          })
        );

        // 获取调用结果
        const toolMessages = results.map((result, index) => ({
          role: "tool" as "tool",
          content: result.content as string,
          tool_call_id: toolCalls[index].id,
        }));

        // 这里消息需要带上一开始问题, 同时需要第一次tools call的响应结果作为上下文, 如果不带上会失败
        // InternalError.Algo.InvalidParameter: messages with role "tool" must be a response to a preceeding message with "tool_calls".
        messages.push(choice.message);
        // 然后把tools调用结果内容都放进来
        messages.push(...toolMessages);
        
        try {
          // 再次调用, 这里没有传递tools, 因为是简单例子, 就忽略一些多轮推导类似的特性, 只进行一次tools调用, 然后观察结果就好了
          const response = await this.openai.chat.completions.create({
            model: process.env.MODEL as string,
            messages: messages,
          });

          finalText.push(
            response.choices[0].message.content
              ? response.choices[0].message.content
              : ""
          );
        } catch (e) {
          console.log(e);
        }
      }
    }

    return finalText.join("\n");
  }

  // 大模型对话循环,
  async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\nMCP Client Started!");
      console.log("Type your queries or 'quit' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }
        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }

  // 关闭连接
  async cleanup() {
    await this.mcp.close();
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node index.ts <path_to_server_script>");
    return;
  }
  const mcpClient = new MCPClient();
  try {
    await mcpClient.connectToServer(process.argv[2]);
    await mcpClient.chatLoop();
  } finally {
    await mcpClient.cleanup();
    process.exit(0);
  }
}

main();
