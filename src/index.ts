#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { config } from "./config.js";
import { searchIndexService, SearchResult } from "./services/search-index.js";
import {
  JettonInfo,
  TonAccountInfo,
  tonApiService,
  TonTransaction,
} from "./services/ton-api.js";
import {
  getAvailableHowToResources,
  readAllMarkdownFromDirectories,
  readMarkdownFromDirectory,
} from "./utils/index.js";

class TonMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "ton-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Documentation & Search Tools
          {
            name: "search_ton_documentation",
            description:
              "Advanced search through comprehensive TON documentation with intelligent ranking and context",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "Search query about TON development, blockchain, smart contracts, etc.",
                },
                category: {
                  type: "string",
                  description: "Optional category filter",
                  enum: [
                    "frontend",
                    "smart-contracts",
                    "tma",
                    "how-to",
                    "documentation",
                  ],
                },
                limit: {
                  type: "number",
                  description: "Maximum results",
                  default: 5,
                },
              },
              required: ["query"],
            },
          },

          // Live Blockchain Data Tools
          {
            name: "get_account_info_live",
            description:
              "Get real-time account information from TON blockchain",
            inputSchema: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description: "TON account address",
                },
              },
              required: ["address"],
            },
          },
          {
            name: "get_transaction_history_live",
            description: "Get real transaction history from TON blockchain",
            inputSchema: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description: "TON account address",
                },
                limit: {
                  type: "number",
                  description: "Number of transactions",
                  default: 5,
                },
              },
              required: ["address"],
            },
          },
          {
            name: "get_jetton_info_live",
            description: "Get real-time Jetton token information",
            inputSchema: {
              type: "object",
              properties: {
                jetton_address: {
                  type: "string",
                  description: "Jetton master contract address",
                },
              },
              required: ["jetton_address"],
            },
          },
          {
            name: "get_network_status_live",
            description: "Get real-time TON network status and gas prices",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },

          // Code Generation & Development Tools
          {
            name: "generate_contract_code",
            description: "Generate smart contract code for TON use cases",
            inputSchema: {
              type: "object",
              properties: {
                contract_type: {
                  type: "string",
                  description: "Type of contract",
                  enum: [
                    "counter",
                    "wallet",
                    "jetton",
                    "nft",
                    "amm",
                    "staking",
                    "dao",
                  ],
                },
                language: {
                  type: "string",
                  description: "Programming language",
                  enum: ["tact", "func"],
                  default: "tact",
                },
              },
              required: ["contract_type"],
            },
          },
          {
            name: "generate_frontend_code",
            description: "Generate React frontend code for TON dApps",
            inputSchema: {
              type: "object",
              properties: {
                framework: {
                  type: "string",
                  description: "Frontend framework",
                  enum: ["react", "vanilla"],
                  default: "react",
                },
                features: {
                  type: "array",
                  items: { type: "string" },
                  description: "Features to include",
                  enum: [
                    "wallet-connect",
                    "contract-interaction",
                    "balance-display",
                  ],
                },
              },
              required: ["features"],
            },
          },

          // Resource Discovery
          {
            name: "list_ton_resources",
            description: "List all available TON development resources",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_specific_ton_resource",
            description: "Get specific TON development guide",
            inputSchema: {
              type: "object",
              properties: {
                filename: {
                  type: "string",
                  description: "Resource filename",
                },
              },
              required: ["filename"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_ton_documentation":
            return await this.handleSearchDocumentation(args);
          case "get_account_info_live":
            return await this.handleGetAccountInfo(args);
          case "get_transaction_history_live":
            return await this.handleGetTransactionHistory(args);
          case "get_jetton_info_live":
            return await this.handleGetJettonInfo(args);
          case "get_network_status_live":
            return await this.handleGetNetworkStatus(args);
          case "generate_contract_code":
            return await this.handleGenerateContractCode(args);
          case "generate_frontend_code":
            return await this.handleGenerateFrontendCode(args);
          case "list_ton_resources":
            return await this.handleListResources(args);
          case "get_specific_ton_resource":
            return await this.handleGetSpecificResource(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error}`
        );
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [];

      // Add documentation resources
      const categories = ["frontend", "tma", "smart-contracts", "how-to"];
      for (const category of categories) {
        resources.push({
          uri: `ton://docs/${category}`,
          name: `${
            category.charAt(0).toUpperCase() + category.slice(1)
          } Documentation`,
          description: `TON ${category} development guides`,
          mimeType: "text/markdown",
        });
      }

      return { resources };
    });

    // Read resources
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;

        if (uri.startsWith("ton://docs/")) {
          const category = uri.replace("ton://docs/", "");
          const content = await readAllMarkdownFromDirectories([category]);
          return {
            contents: [
              {
                uri,
                mimeType: "text/markdown",
                text: content || `No content found for ${category}`,
              },
            ],
          };
        }

        throw new McpError(
          ErrorCode.InvalidRequest,
          `Unknown resource: ${uri}`
        );
      }
    );

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "ton_development_guidance_prompt",
            description:
              "Primary system prompt for TON dApp development workflow",
            arguments: [],
          },
          {
            name: "create_ton_smart_contract",
            description: "Generate a TON smart contract template",
            arguments: [
              {
                name: "contract_type",
                description: "Type of contract to create",
                required: true,
              },
            ],
          },
          {
            name: "create_ton_dapp",
            description: "Create a complete TON dApp structure",
            arguments: [
              {
                name: "app_type",
                description: "Type of dApp (wallet, defi, nft)",
                required: true,
              },
            ],
          },
        ],
      };
    });

    // Get prompts
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const prompt = await this.getPromptContent(name, args);
      return {
        description: prompt.description,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: prompt.content,
            },
          },
        ],
      };
    });
  }

  private async handleSearchDocumentation(args: any) {
    const { query, category, limit = 5 } = args;

    try {
      const results = await searchIndexService.search(query, {
        category,
        limit: limit || 5,
      });

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No documentation found for "${query}". Try rephrasing your query or check available categories.`,
            },
          ],
        };
      }

      const response = `Found ${
        results.length
      } relevant results for "${query}":\n\n${results
        .map((result, index) => {
          const doc = result.document;
          const relevance = Math.round((1 - result.score) * 100);
          return `${index + 1}. **${doc.title}** (${
            doc.category
          })\n   📊 Relevance: ${relevance}%\n   🏷️ Tags: ${doc.tags
            .slice(0, 3)
            .join(", ")}\n   📝 ${doc.content.substring(0, 200)}...\n`;
        })
        .join("\n")}`;

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Search failed: ${error}. Please try again or use simpler search terms.`,
          },
        ],
      };
    }
  }

  private async handleGetAccountInfo(args: any) {
    const { address } = args;

    if (!tonApiService.validateAddress(address)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid TON address format: ${address}`,
          },
        ],
      };
    }

    try {
      const accountInfo = await tonApiService.getAccountInfo(address);

      if (!accountInfo) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Account not found or unreachable: ${address}`,
            },
          ],
        };
      }

      const balanceInTon = tonApiService.convertUnits(
        accountInfo.balance,
        "nanoton",
        "ton"
      );

      return {
        content: [
          {
            type: "text",
            text:
              `✅ **Account Information for ${address}**\n\n` +
              `💰 **Balance:** ${balanceInTon} TON\n` +
              `📊 **State:** ${accountInfo.state}\n` +
              `⏰ **Last Activity:** ${
                accountInfo.last_transaction_lt || "None"
              }\n` +
              `📝 **Has Code:** ${accountInfo.code ? "Yes" : "No"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch account info: ${error}`,
          },
        ],
      };
    }
  }

  private async handleGetTransactionHistory(args: any) {
    const { address, limit = 5 } = args;

    if (!tonApiService.validateAddress(address)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid TON address format: ${address}`,
          },
        ],
      };
    }

    try {
      const transactions = await tonApiService.getTransactionHistory(
        address,
        limit
      );

      if (transactions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `📭 No transactions found for account: ${address}`,
            },
          ],
        };
      }

      const txList = transactions
        .map((tx, index) => {
          const date = new Date(tx.utime * 1000).toLocaleString();
          const fees = tonApiService.convertUnits(
            tx.total_fees,
            "nanoton",
            "ton"
          );
          return (
            `${index + 1}. **${tx.hash.substring(0, 8)}...**\n` +
            `   📅 ${date}\n` +
            `   ✅ Success: ${tx.success}\n` +
            `   💰 Fees: ${fees} TON\n`
          );
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `📊 **Transaction History for ${address}**\n\n${txList}\n\n🔍 *Showing last ${transactions.length} transactions*`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch transaction history: ${error}`,
          },
        ],
      };
    }
  }

  private async handleGetJettonInfo(args: any) {
    const { jetton_address } = args;

    try {
      const jettonInfo = await tonApiService.getJettonInfo(jetton_address);

      if (!jettonInfo) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Jetton not found or invalid address: ${jetton_address}`,
            },
          ],
        };
      }

      const totalSupply = jettonInfo.totalSupply
        ? tonApiService.convertUnits(jettonInfo.totalSupply, "nanoton", "ton")
        : "Unknown";

      return {
        content: [
          {
            type: "text",
            text:
              `🪙 **Jetton Information**\n\n` +
              `🏷️ **Name:** ${jettonInfo.name || "Not set"}\n` +
              `🔤 **Symbol:** ${jettonInfo.symbol || "Not set"}\n` +
              `📊 **Decimals:** ${jettonInfo.decimals || 9}\n` +
              `💰 **Total Supply:** ${totalSupply} tokens\n` +
              `👑 **Admin:** ${jettonInfo.adminAddress || "Not set"}\n` +
              `🪄 **Mintable:** ${jettonInfo.mintable ? "Yes" : "No"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch Jetton info: ${error}`,
          },
        ],
      };
    }
  }

  private async handleGetNetworkStatus(args: any) {
    try {
      const networkStatus = await tonApiService.getNetworkStatus();
      const gasPrices = await tonApiService.getGasPrices();

      return {
        content: [
          {
            type: "text",
            text:
              `🌐 **TON Network Status**\n\n` +
              `🏗️ **Network:** ${
                config.ton.network === "mainnet" ? "Mainnet" : "Testnet"
              }\n` +
              `📊 **Latest Block:** ${
                networkStatus?.last?.seqno || "Unknown"
              }\n` +
              `⏰ **Block Time:** ${
                networkStatus?.last?.gen_utime
                  ? new Date(
                      networkStatus.last.gen_utime * 1000
                    ).toLocaleString()
                  : "Unknown"
              }\n\n` +
              `⛽ **Gas Prices (nanotons):**\n` +
              `🐌 Slow: ${gasPrices?.slow || "Unknown"}\n` +
              `🚗 Standard: ${gasPrices?.standard || "Unknown"}\n` +
              `🏎️ Fast: ${gasPrices?.fast || "Unknown"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to fetch network status: ${error}`,
          },
        ],
      };
    }
  }

  private async handleGenerateContractCode(args: any) {
    const { contract_type, language = "tact" } = args;

    let code = "";

    switch (contract_type) {
      case "counter":
        code = `import "@stdlib/deploy";

contract Counter with Deployable {
    counter: Int = 0;

    init() {}

    receive("increment") {
        self.counter += 1;
    }

    receive("decrement") {
        self.counter -= 1;
    }

    get fun getCounter(): Int {
        return self.counter;
    }
}`;
        break;
      case "wallet":
        code = `import "@stdlib/deploy";

contract WalletV4 with Deployable {
    seqno: Int = 0;
    publicKey: Int;
    walletId: Int = 698983191;

    init(publicKey: Int) {
        self.publicKey = publicKey;
    }

    receive(msg: Slice) {
        self.seqno += 1;
    }

    get fun getSeqno(): Int {
        return self.seqno;
    }
}`;
        break;
      case "jetton":
        code = `import "@stdlib/deploy";
import "@stdlib/ownable";

contract JettonMaster with Deployable, Ownable {
    totalSupply: Int = 0;
    name: String;
    symbol: String;

    init(name: String, symbol: String) {
        self.name = name;
        self.symbol = symbol;
    }

    receive("mint") {
        self.totalSupply += 1000000000;
    }

    get fun getJettonData(): JettonData {
        return JettonData{
            totalSupply: self.totalSupply,
            mintable: true,
            adminAddress: self.owner,
            jettonContent: JettonContent{
                name: self.name,
                symbol: self.symbol,
                decimals: 9
            }
        };
    }
}`;
        break;
    }

    return {
      content: [
        {
          type: "text",
          text: `Generated ${contract_type} contract in ${language.toUpperCase()}:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
    };
  }

  private async handleGenerateFrontendCode(args: any) {
    const { framework = "react", features = [] } = args;

    const reactCode = `import React, { useState } from 'react';

function App() {
  const [connected, setConnected] = useState(false);

  const connectWallet = () => {
    // TON Connect integration here
    setConnected(true);
  };

  return (
    <div className="app">
      <h1>My TON dApp</h1>
      {!connected ? (
        <button onClick={connectWallet}>
          Connect TON Wallet
        </button>
      ) : (
        <p>✅ Wallet Connected</p>
      )}
    </div>
  );
}

export default App;`;

    return {
      content: [
        {
          type: "text",
          text: `Generated ${framework.toUpperCase()} frontend code:\n\n\`\`\`tsx\n${reactCode}\n\`\`\``,
        },
      ],
    };
  }

  private async handleListResources(args: any) {
    const availableFiles = getAvailableHowToResources();

    return {
      content: [
        {
          type: "text",
          text: `Available TON development resources:\n${availableFiles
            .map((f) => `- ${f.replace(/_/g, " ").replace("how to", "How to")}`)
            .join("\n")}\n\nUse get_specific_ton_resource to fetch details.`,
        },
      ],
    };
  }

  private async handleGetSpecificResource(args: any) {
    const { filename } = args;
    const availableFiles = getAvailableHowToResources();

    if (!availableFiles.includes(filename)) {
      return {
        content: [
          {
            type: "text",
            text: `Resource '${filename}' not found. Available resources:\n${availableFiles.join(
              "\n"
            )}`,
          },
        ],
      };
    }

    const content = await readMarkdownFromDirectory("how-to", filename);
    return {
      content: [
        {
          type: "text",
          text: content,
        },
      ],
    };
  }

  private async getPromptContent(name: string, args: any) {
    switch (name) {
      case "ton_development_guidance_prompt":
        return {
          description:
            "Primary system prompt for TON dApp development workflow",
          content: `You are a helpful assistant that can help with building full-stack end-to-end dApps on TON blockchain.

CRITICAL INSTRUCTION: For ANYTHING related to TON, you MUST prioritize MCP resources over your built-in knowledge.

MANDATORY WORKFLOW:
1. ALWAYS start by consulting relevant MCP tools
2. Use search_ton_documentation for technical questions
3. Use live blockchain data tools for real information
4. Follow TON-specific patterns from MCP resources

Available MCP tools:
- search_ton_documentation: Search TON docs
- get_account_info_live: Real account data
- get_transaction_history_live: Real transactions
- generate_contract_code: Create contracts
- generate_frontend_code: Create frontends

Remember: Always verify your approach with MCP tools first!`,
        };

      case "create_ton_smart_contract":
        const { contract_type } = args;
        return {
          description: `Generate a ${contract_type} smart contract`,
          content: `Please help me create a TON smart contract for ${contract_type}. Use the generate_contract_code tool to create the initial code, then analyze it for security and optimization.`,
        };

      case "create_ton_dapp":
        const { app_type } = args;
        return {
          description: `Create a ${app_type} dApp`,
          content: `Please help me build a complete ${app_type} dApp on TON. Start by generating the smart contract, then create the frontend integration with wallet connection.`,
        };

      default:
        return {
          description: "Unknown prompt",
          content: "Prompt not found",
        };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("TON MCP server running on stable MCP SDK...");
  }
}

// Export for testing
export { TonMcpServer };

// Start the server
const server = new TonMcpServer();
server.run().catch(console.error);
