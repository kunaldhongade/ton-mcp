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
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);
const VERSION = packageJson.version;

import { config } from "./config.js";
import { ContractParser } from "./services/contract-parser.js";
import { deploymentService } from "./services/deployment.js";
import { projectScaffoldService } from "./services/project-scaffold.js";
import { searchIndexService, SearchResult } from "./services/search-index.js";
import { TestGenerator } from "./services/test-generator.js";
import { tolkCompilerService } from "./services/tolk-compiler.js";
import {
  JettonInfo,
  TonAccountInfo,
  tonApiService,
  TonTransaction,
} from "./services/ton-api.js";
import { WrapperGenerator } from "./services/wrapper-generator.js";
import {
  getAllTolkTemplateNames,
  getTolkTemplate,
} from "./templates/tolk-contracts.js";
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
        version: VERSION,
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
                    "dao",
                    "staking",
                    "multisig",
                  ],
                },
                language: {
                  type: "string",
                  description:
                    "Programming language (tolk is recommended - new modern language)",
                  enum: ["tact", "func", "tolk"],
                  default: "tolk",
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
          {
            name: "compile_tolk_contract",
            description:
              "Compile Tolk smart contract to BOC (requires tolk compiler installed)",
            inputSchema: {
              type: "object",
              properties: {
                source_code: {
                  type: "string",
                  description: "Tolk source code to compile",
                },
                contract_name: {
                  type: "string",
                  description: "Name of the contract",
                  default: "contract",
                },
              },
              required: ["source_code"],
            },
          },
          {
            name: "validate_tolk_syntax",
            description:
              "Validate Tolk smart contract syntax without compiling",
            inputSchema: {
              type: "object",
              properties: {
                source_code: {
                  type: "string",
                  description: "Tolk source code to validate",
                },
              },
              required: ["source_code"],
            },
          },
          {
            name: "generate_deployment_script",
            description: "Generate deployment script for TON smart contract",
            inputSchema: {
              type: "object",
              properties: {
                network: {
                  type: "string",
                  description: "Target network",
                  enum: ["mainnet", "testnet"],
                  default: "testnet",
                },
                contract_code: {
                  type: "string",
                  description: "Compiled contract code (hex)",
                },
                value: {
                  type: "string",
                  description: "Amount of TON to send with deployment",
                  default: "0.05",
                },
              },
              required: ["contract_code"],
            },
          },
          {
            name: "generate_contract_wrapper",
            description:
              "Generate TypeScript wrapper for TON smart contract to interact with it from frontend",
            inputSchema: {
              type: "object",
              properties: {
                contract_code: {
                  type: "string",
                  description: "Smart contract source code",
                },
                language: {
                  type: "string",
                  description: "Contract language",
                  enum: ["tact", "func", "tolk"],
                },
                contract_name: {
                  type: "string",
                  description:
                    "Name of the contract (optional, auto-detected if not provided)",
                },
              },
              required: ["contract_code", "language"],
            },
          },
          {
            name: "generate_test_file",
            description:
              "Generate test file for TON smart contract using Blueprint's Sandbox testing framework",
            inputSchema: {
              type: "object",
              properties: {
                contract_code: {
                  type: "string",
                  description:
                    "Smart contract source code to generate tests for",
                },
                language: {
                  type: "string",
                  description: "Contract language",
                  enum: ["tact", "func", "tolk"],
                },
                contract_name: {
                  type: "string",
                  description:
                    "Name of the contract (optional, auto-detected if not provided)",
                },
              },
              required: ["contract_code", "language"],
            },
          },
          {
            name: "create_ton_project",
            description:
              "Create a complete TON project scaffold (smart contract, TMA, or full-stack dApp)",
            inputSchema: {
              type: "object",
              properties: {
                project_name: {
                  type: "string",
                  description: "Name of the project",
                },
                project_type: {
                  type: "string",
                  description: "Type of project to create",
                  enum: ["smart-contract", "tma", "dapp-fullstack"],
                },
                language: {
                  type: "string",
                  description: "Smart contract language",
                  enum: ["tolk", "tact", "func"],
                  default: "tolk",
                },
                framework: {
                  type: "string",
                  description: "Frontend framework (for TMA/dApp)",
                  enum: ["react", "next", "vanilla"],
                  default: "react",
                },
              },
              required: ["project_name", "project_type"],
            },
          },
          {
            name: "deploy_contract",
            description:
              "Deploy smart contract to TON blockchain (testnet or mainnet)",
            inputSchema: {
              type: "object",
              properties: {
                network: {
                  type: "string",
                  description: "Target network",
                  enum: ["mainnet", "testnet"],
                  default: "testnet",
                },
                project_path: {
                  type: "string",
                  description: "Path to project directory (uses Blueprint)",
                },
                contract_code: {
                  type: "string",
                  description:
                    "Compiled contract code (base64) - alternative to project_path",
                },
                value: {
                  type: "string",
                  description: "Amount of TON for deployment",
                  default: "0.1",
                },
              },
            },
          },
          {
            name: "check_deployment_status",
            description: "Check if a contract is deployed and get its status",
            inputSchema: {
              type: "object",
              properties: {
                contract_address: {
                  type: "string",
                  description: "Contract address to check",
                },
                network: {
                  type: "string",
                  description: "Network to check",
                  enum: ["mainnet", "testnet"],
                  default: "testnet",
                },
              },
              required: ["contract_address"],
            },
          },
          {
            name: "get_deployment_guide",
            description: "Get step-by-step deployment guide for a contract",
            inputSchema: {
              type: "object",
              properties: {
                contract_name: {
                  type: "string",
                  description: "Name of the contract",
                },
                network: {
                  type: "string",
                  description: "Target network",
                  enum: ["mainnet", "testnet"],
                  default: "testnet",
                },
              },
              required: ["contract_name"],
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
          case "compile_tolk_contract":
            return await this.handleCompileTolk(args);
          case "validate_tolk_syntax":
            return await this.handleValidateTolk(args);
          case "generate_deployment_script":
            return await this.handleGenerateDeploymentScript(args);
          case "generate_contract_wrapper":
            return await this.handleGenerateContractWrapper(args);
          case "generate_test_file":
            return await this.handleGenerateTestFile(args);
          case "create_ton_project":
            return await this.handleCreateProject(args);
          case "deploy_contract":
            return await this.handleDeployContract(args);
          case "check_deployment_status":
            return await this.handleCheckDeploymentStatus(args);
          case "get_deployment_guide":
            return await this.handleGetDeploymentGuide(args);
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
        // Provide helpful suggestions based on common queries
        const suggestions: Record<string, string> = {
          tolk: 'Did you mean "Tact"? Tact is the recommended programming language for TON smart contracts. Try searching for "Tact programming language" or "Tact language".',
          talk: 'Did you mean "Tact"? Tact is the programming language for TON. Try searching for "Tact".',
          "ton language":
            'TON uses Tact and FunC programming languages. Try searching for "Tact" or "FunC".',
          "programming language":
            'TON supports Tact (recommended) and FunC languages. Try searching for "Tact" or "FunC".',
        };

        const lowerQuery = query.toLowerCase();
        let suggestion = "";
        for (const [key, value] of Object.entries(suggestions)) {
          if (lowerQuery.includes(key)) {
            suggestion = value;
            break;
          }
        }

        const fallbackMessage =
          suggestion ||
          `No documentation found for "${query}". Try searching for:\n` +
            `- "Tact programming language" (TON's recommended language)\n` +
            `- "FunC language" (TON's low-level language)\n` +
            `- "Smart contracts"\n` +
            `- "Jettons" (TON tokens)\n` +
            `- "TON Connect" (wallet integration)\n` +
            `\nOr visit https://docs.ton.org/ for complete documentation.`;

        return {
          content: [
            {
              type: "text",
              text: fallbackMessage,
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
    const { contract_type, language = "tolk" } = args;

    // Use Tolk templates if language is tolk
    if (language === "tolk") {
      const code = getTolkTemplate(contract_type);

      return {
        content: [
          {
            type: "text",
            text: `Generated ${contract_type} contract in **Tolk** (TON's modern language):\n\n\`\`\`tolk\n${code}\n\`\`\`\n\n**Next steps:**\n1. Use \`compile_tolk_contract\` to compile this code\n2. Use \`generate_deployment_script\` to create deployment script\n3. Deploy to testnet first for testing`,
          },
        ],
      };
    }

    // Use FunC templates if language is func
    if (language === "func" || language === "FunC") {
      let funcCode = "";

      switch (contract_type) {
        case "counter":
          funcCode = `
;; Simple Counter Contract in FunC

global int counter;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {  ;; Bounced message
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {  ;; Increment
        counter += 1;
        save_data(begin_cell().store_uint(counter, 32).end_cell());
    }
    elseif (op == 2) {  ;; Decrement
        counter -= 1;
        save_data(begin_cell().store_uint(counter, 32).end_cell());
    }
}

int get_counter() method_id {
    load_data();
    return counter;
}

() load_data() impure {
    slice ds = get_data().begin_parse();
    counter = ds~load_uint(32);
}

() save_data(cell data) impure {
    set_data(data);
}
`;
          break;

        case "wallet":
          funcCode = `
;; Wallet V4 Contract in FunC

global int seqno;
global int subwallet_id;
global int public_key;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; Accept incoming transfers
}

() recv_external(slice in_msg) impure {
    var signature = in_msg~load_bits(512);
    var cs = in_msg;
    var (subwallet_id_from_msg, valid_until, msg_seqno) = (cs~load_uint(32), cs~load_uint(32), cs~load_uint(32));
    
    throw_if(35, valid_until <= now());
    throw_unless(33, subwallet_id_from_msg == subwallet_id);
    throw_unless(34, msg_seqno == seqno);
    
    accept_message();
    
    cs~touch();
    
    while (cs.slice_refs()) {
        var mode = cs~load_uint(8);
        send_raw_message(cs~load_ref(), mode);
    }
    
    seqno += 1;
    save_data();
}

int seqno() method_id {
    return seqno;
}

int get_public_key() method_id {
    return public_key;
}

() load_data() impure {
    slice ds = get_data().begin_parse();
    seqno = ds~load_uint(32);
    subwallet_id = ds~load_uint(32);
    public_key = ds~load_uint(256);
}

() save_data() impure {
    set_data(begin_cell()
        .store_uint(seqno, 32)
        .store_uint(subwallet_id, 32)
        .store_uint(public_key, 256)
        .end_cell());
}
`;
          break;

        case "jetton":
          funcCode = `
;; Jetton Master Contract in FunC
;; TEP-74 standard implementation

global int total_supply;
global slice admin_address;
global cell jetton_wallet_code;
global cell content;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 21) {  ;; Mint
        throw_unless(73, equal_slices(sender_addr, admin_address));
        
        int amount = in_msg_body~load_coins();
        slice to_address = in_msg_body~load_msg_addr();
        
        total_supply += amount;
        save_data();
        
        ;; Send internal transfer to jetton wallet
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(to_address)
            .store_coins(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(0x178d4519, 32)  ;; Internal transfer op
            .store_uint(query_id, 64)
            .store_coins(amount)
            .end_cell();
        
        send_raw_message(msg, 1);
    }
}

(int, int, slice, cell, cell) get_jetton_data() method_id {
    load_data();
    return (total_supply, -1, admin_address, content, jetton_wallet_code);
}

() load_data() impure {
    slice ds = get_data().begin_parse();
    total_supply = ds~load_coins();
    admin_address = ds~load_msg_addr();
    jetton_wallet_code = ds~load_ref();
    content = ds~load_ref();
}

() save_data() impure {
    set_data(begin_cell()
        .store_coins(total_supply)
        .store_slice(admin_address)
        .store_ref(jetton_wallet_code)
        .store_ref(content)
        .end_cell());
}
`;
          break;

        case "nft":
          funcCode = `
;; NFT Item Contract in FunC
;; TEP-62 standard implementation

global int index;
global slice collection_address;
global slice owner_address;
global cell content;
global int initialized;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 0x5fcc3d14) {  ;; Transfer
        throw_unless(401, equal_slices(sender_addr, owner_address));
        
        slice new_owner = in_msg_body~load_msg_addr();
        slice response_destination = in_msg_body~load_msg_addr();
        int forward_amount = in_msg_body~load_coins();
        
        owner_address = new_owner;
        save_data();
        
        if (forward_amount > 0) {
            var msg = begin_cell()
                .store_uint(0x10, 6)
                .store_slice(new_owner)
                .store_coins(forward_amount)
                .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
                .store_uint(0x05138d91, 32)  ;; Ownership assigned
                .store_uint(query_id, 64)
                .store_slice(owner_address)
                .end_cell();
            
            send_raw_message(msg, 1);
        }
    }
}

(int, int, slice, slice, cell) get_nft_data() method_id {
    load_data();
    return (initialized ? 1 : -1, index, collection_address, owner_address, content);
}

() load_data() impure {
    slice ds = get_data().begin_parse();
    index = ds~load_uint(64);
    collection_address = ds~load_msg_addr();
    initialized = ds~load_int(1);
    owner_address = ds~load_msg_addr();
    content = ds~load_ref();
}

() save_data() impure {
    set_data(begin_cell()
        .store_uint(index, 64)
        .store_slice(collection_address)
        .store_int(initialized, 1)
        .store_slice(owner_address)
        .store_ref(content)
        .end_cell());
}
`;
          break;

        case "dao":
          funcCode = `
;; DAO Governance Contract in FunC

global cell proposals;
global slice admin;
global int proposal_count;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 1) {  ;; Create proposal
        cell title = in_msg_body~load_ref();
        cell description = in_msg_body~load_ref();
        int voting_period = in_msg_body~load_uint(32);
        
        proposal_count += 1;
        
        cell proposal = begin_cell()
            .store_uint(proposal_count, 32)
            .store_slice(sender_addr)
            .store_ref(title)
            .store_ref(description)
            .store_uint(now() + voting_period, 32)
            .store_uint(0, 32)  ;; yes votes
            .store_uint(0, 32)  ;; no votes
            .store_int(0, 1)    ;; executed
            .end_cell();
        
        proposals~udict_set(32, proposal_count, proposal.begin_parse());
        save_data();
    }
    elseif (op == 2) {  ;; Vote
        int proposal_id = in_msg_body~load_uint(32);
        int vote = in_msg_body~load_int(1);
        
        (cell proposal, int found) = proposals.udict_get?(32, proposal_id);
        throw_unless(404, found);
        
        ;; Update vote count
        save_data();
    }
}

(int, int) get_proposal_votes(int proposal_id) method_id {
    load_data();
    (cell proposal, int found) = proposals.udict_get?(32, proposal_id);
    throw_unless(404, found);
    
    slice ps = proposal.begin_parse();
    ps~skip_bits(32 + 267 + 32);
    
    int yes_votes = ps~load_uint(32);
    int no_votes = ps~load_uint(32);
    
    return (yes_votes, no_votes);
}

() load_data() impure {
    slice ds = get_data().begin_parse();
    proposals = ds~load_dict();
    admin = ds~load_msg_addr();
    proposal_count = ds~load_uint(32);
}

() save_data() impure {
    set_data(begin_cell()
        .store_dict(proposals)
        .store_slice(admin)
        .store_uint(proposal_count, 32)
        .end_cell());
}
`;
          break;

        case "staking":
          funcCode = `
;; Staking Pool Contract in FunC

global slice owner;
global int total_staked;
global int reward_rate;
global cell stakers;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {  ;; Stake
        int amount = msg_value;
        throw_unless(100, amount > 0);
        
        (cell staker_data, int found) = stakers.udict_get?(267, sender_addr.slice_hash());
        
        if (found) {
            slice sd = staker_data.begin_parse();
            int current_stake = sd~load_coins();
            int last_claim = sd~load_uint(32);
            
            staker_data = begin_cell()
                .store_coins(current_stake + amount)
                .store_uint(now(), 32)
                .end_cell();
        } else {
            staker_data = begin_cell()
                .store_coins(amount)
                .store_uint(now(), 32)
                .end_cell();
        }
        
        stakers~udict_set(267, sender_addr.slice_hash(), staker_data.begin_parse());
        total_staked += amount;
        save_data();
    }
    elseif (op == 2) {  ;; Unstake
        (cell staker_data, int found) = stakers.udict_get?(267, sender_addr.slice_hash());
        throw_unless(404, found);
        
        slice sd = staker_data.begin_parse();
        int staked_amount = sd~load_coins();
        
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(sender_addr)
            .store_coins(staked_amount)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .end_cell();
        
        send_raw_message(msg, 1);
        
        stakers~udict_delete?(267, sender_addr.slice_hash());
        total_staked -= staked_amount;
        save_data();
    }
}

int get_total_staked() method_id {
    load_data();
    return total_staked;
}

() load_data() impure {
    slice ds = get_data().begin_parse();
    owner = ds~load_msg_addr();
    total_staked = ds~load_coins();
    reward_rate = ds~load_uint(16);
    stakers = ds~load_dict();
}

() save_data() impure {
    set_data(begin_cell()
        .store_slice(owner)
        .store_coins(total_staked)
        .store_uint(reward_rate, 16)
        .store_dict(stakers)
        .end_cell());
}
`;
          break;

        case "amm":
          funcCode = `
;; AMM (Automated Market Maker) Contract in FunC

global int reserve0;
global int reserve1;
global int total_liquidity;
global cell liquidity_providers;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 1) {  ;; Add Liquidity
        int amount0 = in_msg_body~load_coins();
        int amount1 = in_msg_body~load_coins();
        
        int liquidity = 0;
        
        if (total_liquidity == 0) {
            liquidity = sqrt(amount0 * amount1);
        } else {
            int liquidity0 = (amount0 * total_liquidity) / reserve0;
            int liquidity1 = (amount1 * total_liquidity) / reserve1;
            liquidity = min(liquidity0, liquidity1);
        }
        
        reserve0 += amount0;
        reserve1 += amount1;
        total_liquidity += liquidity;
        
        liquidity_providers~udict_set(267, sender_addr.slice_hash(), 
            begin_cell().store_coins(liquidity).end_cell().begin_parse());
        
        save_data();
    }
    elseif (op == 3) {  ;; Swap Token0 for Token1
        int amount0_in = in_msg_body~load_coins();
        
        ;; Constant product formula with 0.3% fee
        int amount0_in_with_fee = amount0_in * 997;
        int numerator = amount0_in_with_fee * reserve1;
        int denominator = (reserve0 * 1000) + amount0_in_with_fee;
        int amount1_out = numerator / denominator;
        
        reserve0 += amount0_in;
        reserve1 -= amount1_out;
        
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(sender_addr)
            .store_coins(amount1_out)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .end_cell();
        
        send_raw_message(msg, 64);
        save_data();
    }
}

int sqrt(int x) {
    if (x == 0) {
        return 0;
    }
    int z = (x + 1) / 2;
    int y = x;
    while (z < y) {
        y = z;
        z = (x / z + z) / 2;
    }
    return y;
}

int min(int a, int b) {
    return a < b ? a : b;
}

(int, int, int) get_reserves() method_id {
    load_data();
    return (reserve0, reserve1, total_liquidity);
}

() load_data() impure {
    slice ds = get_data().begin_parse();
    reserve0 = ds~load_coins();
    reserve1 = ds~load_coins();
    total_liquidity = ds~load_coins();
    liquidity_providers = ds~load_dict();
}

() save_data() impure {
    set_data(begin_cell()
        .store_coins(reserve0)
        .store_coins(reserve1)
        .store_coins(total_liquidity)
        .store_dict(liquidity_providers)
        .end_cell());
}
`;
          break;

        case "multisig":
          funcCode = `
;; Multisig Wallet Contract in FunC

global int n;
global int k;
global cell signers;
global int next_order_seqno;

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    ;; Accept transfers
}

() recv_external(slice in_msg) impure {
    int order_seqno = in_msg~load_uint(32);
    throw_unless(33, order_seqno == next_order_seqno);
    
    int valid_until = in_msg~load_uint(32);
    throw_if(35, valid_until <= now());
    
    int signer_index = in_msg~load_uint(8);
    var signature = in_msg~load_bits(512);
    
    (cell signer, int found) = signers.udict_get?(8, signer_index);
    throw_unless(34, found);
    
    slice s = signer.begin_parse();
    int pubkey = s~load_uint(256);
    
    throw_unless(35, check_signature(slice_hash(in_msg), signature, pubkey));
    
    accept_message();
    
    int sig_count = in_msg~load_uint(8);
    
    if (sig_count >= k) {
        cell msg = in_msg~load_ref();
        int mode = in_msg~load_uint(8);
        send_raw_message(msg, mode);
        
        next_order_seqno += 1;
        save_data();
    }
}

(int, int, int) get_multisig_data() method_id {
    load_data();
    return (n, k, next_order_seqno);
}

() load_data() impure {
    slice ds = get_data().begin_parse();
    n = ds~load_uint(8);
    k = ds~load_uint(8);
    signers = ds~load_dict();
    next_order_seqno = ds~load_uint(32);
}

() save_data() impure {
    set_data(begin_cell()
        .store_uint(n, 8)
        .store_uint(k, 8)
        .store_dict(signers)
        .store_uint(next_order_seqno, 32)
        .end_cell());
}
`;
          break;

        default:
          funcCode = `
;; Contract type "${contract_type}" not supported yet in FunC.
;; Supported types: counter, wallet, jetton, nft, dao, staking, amm, multisig
;; 
;; Try using Tact or Tolk language for more contract types.
`;
          break;
      }

      return {
        content: [
          {
            type: "text",
            text: `Generated ${contract_type} contract in **FunC** (TON's original language):\n\n\`\`\`func\n${funcCode}\n\`\`\`\n\n**Next steps:**\n1. Compile using \`func\` compiler or Blueprint\n2. Test your contract thoroughly\n3. Use \`generate_deployment_script\` to create deployment\n4. Deploy to testnet first`,
          },
        ],
      };
    }

    // Tact templates (existing code)
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

      case "nft":
        code = `import "@stdlib/deploy";
import "@stdlib/ownable";

contract NFTCollection with Deployable, Ownable {
    nextItemIndex: Int = 0;
    collectionContent: String;
    
    init(collectionContent: String) {
        self.collectionContent = collectionContent;
    }
    
    receive("mint") {
        let nftItemAddress = self.getNftItemAddress(self.nextItemIndex);
        // Deploy NFT item
        self.nextItemIndex += 1;
    }
    
    get fun getNftItemAddress(index: Int): Address {
        // Calculate NFT item address based on index
        return myAddress();
    }
    
    get fun getCollectionData(): CollectionData {
        return CollectionData{
            nextItemIndex: self.nextItemIndex,
            collectionContent: self.collectionContent,
            ownerAddress: self.owner
        };
    }
}`;
        break;

      case "dao":
        code = `import "@stdlib/deploy";

contract SimpleDAO with Deployable {
    totalVotes: Int = 0;
    proposalCount: Int = 0;
    members: map<Address, Int>;
    
    init() {}
    
    receive("join") {
        let sender = sender();
        self.members.set(sender, 1);
    }
    
    receive("createProposal") {
        self.proposalCount += 1;
    }
    
    receive("vote") {
        let sender = sender();
        require(self.members.get(sender) != null, "Not a member");
        self.totalVotes += 1;
    }
    
    get fun getProposalCount(): Int {
        return self.proposalCount;
    }
    
    get fun getTotalVotes(): Int {
        return self.totalVotes;
    }
}`;
        break;

      case "staking":
        code = `import "@stdlib/deploy";

contract StakingPool with Deployable {
    totalStaked: Int = 0;
    rewardRate: Int = 100; // 1% per period
    stakes: map<Address, Int>;
    
    init() {}
    
    receive("stake") {
        let sender = sender();
        let amount = context().value;
        
        let currentStake = self.stakes.get(sender);
        if (currentStake == null) {
            self.stakes.set(sender, amount);
        } else {
            self.stakes.set(sender, currentStake!! + amount);
        }
        
        self.totalStaked += amount;
    }
    
    receive("unstake") {
        let sender = sender();
        let staked = self.stakes.get(sender);
        require(staked != null, "No stake found");
        
        // Calculate rewards
        let reward = (staked!! * self.rewardRate) / 10000;
        let totalAmount = staked!! + reward;
        
        // Send back stake + reward
        send(SendParameters{
            to: sender,
            value: totalAmount,
            mode: SendRemainingValue
        });
        
        self.stakes.set(sender, null);
        self.totalStaked -= staked!!;
    }
    
    get fun getStake(address: Address): Int {
        let stake = self.stakes.get(address);
        return stake != null ? stake!! : 0;
    }
    
    get fun getTotalStaked(): Int {
        return self.totalStaked;
    }
}`;
        break;

      case "amm":
        code = `import "@stdlib/deploy";

contract SimpleAMM with Deployable {
    reserveA: Int = 0;
    reserveB: Int = 0;
    totalLiquidity: Int = 0;
    liquidity: map<Address, Int>;
    
    init() {}
    
    receive("addLiquidity") {
        let sender = sender();
        let amount = context().value;
        
        // Simple liquidity calculation
        let liquidityMinted = amount;
        
        let currentLiquidity = self.liquidity.get(sender);
        if (currentLiquidity == null) {
            self.liquidity.set(sender, liquidityMinted);
        } else {
            self.liquidity.set(sender, currentLiquidity!! + liquidityMinted);
        }
        
        self.totalLiquidity += liquidityMinted;
        self.reserveA += amount / 2;
        self.reserveB += amount / 2;
    }
    
    receive("swap") {
        let sender = sender();
        let amountIn = context().value;
        
        // Simple constant product formula: x * y = k
        let amountOut = (amountIn * self.reserveB) / (self.reserveA + amountIn);
        
        self.reserveA += amountIn;
        self.reserveB -= amountOut;
        
        send(SendParameters{
            to: sender,
            value: amountOut,
            mode: SendRemainingValue
        });
    }
    
    get fun getReserves(): Reserves {
        return Reserves{
            reserveA: self.reserveA,
            reserveB: self.reserveB
        };
    }
    
    get fun getLiquidity(address: Address): Int {
        let liq = self.liquidity.get(address);
        return liq != null ? liq!! : 0;
    }
}`;
        break;

      case "multisig":
        code = `import "@stdlib/deploy";

contract MultiSigWallet with Deployable {
    owners: map<Address, Bool>;
    ownerCount: Int = 0;
    required: Int;
    transactionCount: Int = 0;
    confirmations: map<Int, map<Address, Bool>>;
    
    init(owners: Address[], required: Int) {
        self.required = required;
        // Add owners
        repeat(owners.size()) {
            let owner = owners.get(i);
            self.owners.set(owner, true);
            self.ownerCount += 1;
        }
    }
    
    receive("submitTransaction") {
        let sender = sender();
        require(self.owners.get(sender) == true, "Not an owner");
        
        self.transactionCount += 1;
        let txId = self.transactionCount;
        
        // Auto-confirm by submitter
        self.confirmTransaction(txId, sender);
    }
    
    receive("confirmTransaction") {
        let sender = sender();
        let txId = context().value; // Simplified
        require(self.owners.get(sender) == true, "Not an owner");
        
        self.confirmTransaction(txId, sender);
    }
    
    fun confirmTransaction(txId: Int, owner: Address) {
        // Add confirmation logic
        let txConfirms = self.confirmations.get(txId);
        if (txConfirms == null) {
            let newMap: map<Address, Bool> = emptyMap();
            newMap.set(owner, true);
            self.confirmations.set(txId, newMap);
        }
    }
    
    get fun isOwner(address: Address): Bool {
        return self.owners.get(address) == true;
    }
    
    get fun getRequired(): Int {
        return self.required;
    }
}`;
        break;

      default:
        code = `// Contract type "${contract_type}" not supported yet.\n// Supported types: counter, wallet, jetton, nft, dao, staking, amm, multisig`;
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
    const { framework = "react", features = [], project_name } = args;

    // Use official @telegram-apps/create-mini-app instead of generating code manually
    const projectName = project_name || "my-ton-app";

    return {
      content: [
        {
          type: "text",
          text: `🚀 **Use Official TON Frontend Tool**

Instead of generating code manually, use the official **@telegram-apps/create-mini-app** tool which provides:
- ✅ Production-ready templates
- ✅ TON Connect integration (pre-configured)
- ✅ Telegram WebApp SDK
- ✅ Modern build system (Vite)
- ✅ TypeScript support
- ✅ Best practices built-in

**Quick Start:**

\`\`\`bash
# Create your TMA project
npx @telegram-apps/create-mini-app@latest ${projectName}

# Follow the prompts:
# 1. Enter project name: ${projectName}
# 2. Select template: ${
            framework === "react"
              ? "React"
              : framework === "next"
              ? "Next.js"
              : "Vanilla"
          }
# 3. Choose package manager: npm

# Navigate to project
cd ${projectName}

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

**What You Get:**

📁 **Project Structure:**
\`\`\`
${projectName}/
├── src/
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── ...
├── public/
│   └── tonconnect-manifest.json  # TON Connect config
├── package.json
└── vite.config.ts
\`\`\`

✨ **Features Included:**
${
  features.includes("wallet-connect")
    ? "- ✅ TON Connect wallet integration (ready to use!)"
    : ""
}
${
  features.includes("contract-interaction")
    ? "- ✅ Contract interaction helpers"
    : ""
}
${features.includes("balance-display") ? "- ✅ Balance display utilities" : ""}
- ✅ Telegram WebApp API
- ✅ Hot Module Replacement (HMR)
- ✅ TypeScript support
- ✅ Modern UI components

**Next Steps:**

1. **Configure TON Connect:**
   Edit \`public/tonconnect-manifest.json\`:
   \`\`\`json
   {
     "url": "https://yourdomain.com",
     "name": "My TON App",
     "iconUrl": "https://yourdomain.com/icon.png"
   }
   \`\`\`

2. **Add Contract Integration:**
   - Use \`generate_contract_wrapper\` to create TypeScript wrapper
   - Copy wrapper to \`src/contracts/\`
   - Import and use in your components

3. **Deploy:**
   - Build: \`npm run build\`
   - Deploy to Vercel/Netlify/GitHub Pages
   - Update Telegram bot with Web App URL

**Documentation:**
- Official Tool: https://github.com/telegram-apps/create-mini-app
- TON Connect: https://docs.ton.org/develop/dapps/ton-connect/
- Telegram WebApps: https://core.telegram.org/bots/webapps

**💡 Why Use Official Tools?**
- ✅ Maintained by TON Foundation
- ✅ Always up-to-date with latest features
- ✅ Follows TON best practices
- ✅ Community support
- ✅ Production-ready from day 1

**Alternative:** If you need a custom setup, use \`create_ton_project\` with type "tma" for more guidance.`,
        },
      ],
    };
  }

  private async handleCompileTolk(args: any) {
    const { source_code, contract_name = "contract" } = args;

    try {
      const result = await tolkCompilerService.compileTolk(
        source_code,
        contract_name
      );

      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **Tolk Compilation Successful!**\n\n${result.output}\n\n**Output files:**\n- BOC file: \`${result.bocFile}\`\n\n**Next steps:**\n1. Use \`generate_deployment_script\` to create deployment\n2. Test on testnet first\n3. Deploy to mainnet when ready`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ **Compilation Failed**\n\n${result.error}\n\n**Common issues:**\n- Syntax errors in Tolk code\n- Missing tolk compiler (install from: https://github.com/ton-blockchain/tolk)\n- Invalid function signatures`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Compilation error: ${error}`,
          },
        ],
      };
    }
  }

  private async handleValidateTolk(args: any) {
    const { source_code } = args;

    try {
      const result = await tolkCompilerService.validateTolk(source_code);

      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **Syntax Valid!**\n\n${result.output}\n\nYour Tolk code has no syntax errors. Ready to compile!`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ **Syntax Errors Found:**\n\n${result.error}\n\nPlease fix these errors before compilation.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Validation error: ${error}`,
          },
        ],
      };
    }
  }

  private async handleGenerateDeploymentScript(args: any) {
    const { network = "testnet", contract_code, value = "0.05" } = args;

    try {
      const script = await tolkCompilerService.generateDeploymentScript({
        network,
        contractCode: contract_code,
        value,
      });

      return {
        content: [
          {
            type: "text",
            text: `Generated deployment script for **${network}**:\n\n\`\`\`typescript\n${script}\n\`\`\`\n\n**To deploy:**\n1. Save this script as \`deploy.ts\`\n2. Set MNEMONIC environment variable\n3. Run: \`npx ts-node deploy.ts\`\n\n**Requirements:**\n- @ton/ton\n- @ton/core\n- @ton/crypto`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to generate deployment script: ${error}`,
          },
        ],
      };
    }
  }

  private async handleGenerateContractWrapper(args: any) {
    const { contract_code, language, contract_name } = args;

    try {
      // Parse the contract
      const parsedContract = ContractParser.parseContract(
        contract_code,
        language
      );

      // Override name if provided
      if (contract_name) {
        parsedContract.name = contract_name;
      }

      // Generate TypeScript wrapper
      const wrapper = WrapperGenerator.generateWrapper(parsedContract);

      return {
        content: [
          {
            type: "text",
            text: `Generated TypeScript wrapper for **${
              parsedContract.name
            }** contract:\n\n\`\`\`typescript\n${wrapper}\n\`\`\`\n\n**What's included:**\n- Contract class implementing TON Contract interface\n- Send methods for all receive messages (${
              parsedContract.methods.filter((m) => m.type === "receive").length
            })\n- Get methods for all getters (${
              parsedContract.methods.filter((m) => m.type === "get").length
            })\n- Proper TypeScript types and error handling\n- Deploy method\n\n**Usage:**\n1. Save as \`${
              parsedContract.name
            }.ts\`\n2. Import in your frontend: \`import { ${
              parsedContract.name
            } } from './${
              parsedContract.name
            }'\`\n3. Create instance: \`const contract = ${
              parsedContract.name
            }.createFromAddress(address)\`\n4. Call methods: \`await contract.sendIncrement(provider, sender, { value: toNano('0.05') })\`\n\n**Next steps:**\n- Customize opcodes if needed\n- Add more specific types\n- Integrate with your frontend app`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to generate contract wrapper: ${error.message}\n\n**Troubleshooting:**\n- Verify contract code is valid ${language}\n- Check for syntax errors\n- Ensure contract has proper structure\n- Try a different language if parsing fails\n\n**Supported languages:** Tact, FunC, Tolk`,
          },
        ],
      };
    }
  }

  private async handleGenerateTestFile(args: any) {
    const { contract_code, language, contract_name } = args;

    try {
      // Parse the contract
      const parsedContract = ContractParser.parseContract(
        contract_code,
        language
      );

      // Override name if provided
      if (contract_name) {
        parsedContract.name = contract_name;
      }

      // Generate test file (filter out init methods and map to test format)
      const testMethods = parsedContract.methods
        .filter((m) => m.type !== "init")
        .map((m) => ({
          name: m.name,
          type: m.type as "receive" | "get",
          params: m.params,
          returnType: m.returnType,
        }));
      const testCode = TestGenerator.generateTestFile({
        contractName: parsedContract.name,
        language: parsedContract.language,
        methods: testMethods,
      });

      // Generate example for Counter if it's a counter contract
      const exampleCode =
        parsedContract.name.toLowerCase() === "counter"
          ? TestGenerator.generateCounterExample()
          : null;

      return {
        content: [
          {
            type: "text",
            text: `Generated test file for **${
              parsedContract.name
            }** contract:\n\n\`\`\`typescript\n${testCode}\n\`\`\`\n\n**What's included:**\n- ✅ Sandbox testing setup\n- ✅ Contract deployment test\n- ✅ Tests for ${
              parsedContract.methods.filter((m) => m.type === "get").length
            } get methods\n- ✅ Tests for ${
              parsedContract.methods.filter((m) => m.type === "receive").length
            } receive methods\n- ✅ Proper assertions and expectations\n\n**Usage:**\n1. Save as \`tests/${
              parsedContract.name
            }.test.ts\`\n2. Ensure you have Blueprint installed: \`npm create ton@latest\`\n3. Run tests: \`npm test\`\n4. Watch mode: \`npm run test:watch\`\n\n**Requirements:**\n- Blueprint project (\`npm create ton@latest\`)\n- @ton/sandbox\n- @ton/test-utils\n- @ton/blueprint\n\n${
              exampleCode
                ? `**Example (Counter contract):**\n\n\`\`\`typescript\n${exampleCode}\n\`\`\`\n\n`
                : ""
            }**Next steps:**\n- Customize test cases for your specific contract\n- Add edge case tests\n- Test error scenarios\n- Add integration tests`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to generate test file: ${error.message}\n\n**Troubleshooting:**\n- Verify contract code is valid ${language}\n- Check for syntax errors\n- Ensure contract has methods to test\n- Try a different language if parsing fails\n\n**Supported languages:** Tact, FunC, Tolk\n\n**Note:** Tests use Blueprint's Sandbox framework. Create a Blueprint project first: \`npm create ton@latest\``,
          },
        ],
      };
    }
  }

  private async handleCreateProject(args: any) {
    const {
      project_name,
      project_type,
      language = "tact",
      framework = "react",
    } = args;

    try {
      let result;

      if (project_type === "smart-contract") {
        result = await projectScaffoldService.createSmartContractProject({
          projectName: project_name,
          projectType: "smart-contract",
          language,
        });
      } else if (project_type === "tma") {
        result = await projectScaffoldService.createTMAProject({
          projectName: project_name,
          projectType: "tma",
          framework,
        });
      } else {
        result = await projectScaffoldService.createFullStackProject({
          projectName: project_name,
          projectType: "dapp-fullstack",
          language,
          framework,
        });
      }

      // Format next steps
      const nextStepsList = result.nextSteps
        .map((step, i) => `${i + 1}. ${step}`)
        .join("\n");

      // Get detailed guide
      const guide = projectScaffoldService.getOfficialToolsGuide(project_type);

      return {
        content: [
          {
            type: "text",
            text: `${result.message}

**Official Tool:** ${result.officialTool}

**How to Create:**

${nextStepsList}

---

${guide}

**Ready to build your TON project!** 🚀

After creation, you can use these MCP tools:
- \`deploy_contract\` - Deploy your contracts
- \`generate_contract_code\` - Generate more contracts
- \`search_ton_documentation\` - Get help`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to create project guide: ${error}`,
          },
        ],
      };
    }
  }

  private async handleDeployContract(args: any) {
    const {
      network = "testnet",
      project_path,
      contract_code,
      value = "0.1",
    } = args;

    try {
      let result;

      if (project_path) {
        // Deploy using Blueprint
        result = await deploymentService.deployWithBlueprint(
          project_path,
          network
        );
      } else if (contract_code) {
        // Direct deployment
        const mnemonic = process.env.MNEMONIC;
        result = await deploymentService.deployContract({
          network,
          mnemonic,
          contractCode: contract_code,
          value,
        });
      } else {
        return {
          content: [
            {
              type: "text",
              text: "❌ Either project_path or contract_code must be provided",
            },
          ],
        };
      }

      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **Contract Deployed Successfully!**

**Network:** ${network}
**Contract Address:** \`${result.contractAddress}\`
${
  result.transactionHash ? `**Transaction:** \`${result.transactionHash}\`` : ""
}

**Explorer:**
${result.explorerUrl}

**Next Steps:**
1. Verify contract on explorer
2. Test contract functions
3. Update frontend with contract address
4. Monitor contract activity

Use \`check_deployment_status\` to verify deployment!`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ **Deployment Failed**

${result.error}

**Troubleshooting:**
- Check wallet has enough TON (recommended: 0.1 TON)
- Verify MNEMONIC is set in environment
- Ensure contract code is valid
- Try testnet first before mainnet`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Deployment error: ${error}`,
          },
        ],
      };
    }
  }

  private async handleCheckDeploymentStatus(args: any) {
    const { contract_address, network = "testnet" } = args;

    try {
      const status = await deploymentService.getDeploymentStatus(
        contract_address,
        network
      );

      if (status.deployed) {
        return {
          content: [
            {
              type: "text",
              text: `✅ **Contract is Active**

**Address:** \`${contract_address}\`
**Network:** ${network}
**Balance:** ${status.balance} nanoTON
${
  status.lastActivity
    ? `**Last Activity:** ${status.lastActivity.toLocaleString()}`
    : ""
}

**Status:** 🟢 Contract is deployed and active

**Explorer:**
https://${
                network === "testnet" ? "testnet." : ""
              }tonviewer.com/${contract_address}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ **Contract Not Found**

**Address:** \`${contract_address}\`
**Network:** ${network}

**Possible Reasons:**
- Contract not yet deployed
- Wrong network (check mainnet vs testnet)
- Invalid contract address
- Deployment still pending

Try deploying with \`deploy_contract\` tool!`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to check deployment status: ${error}`,
          },
        ],
      };
    }
  }

  private async handleGetDeploymentGuide(args: any) {
    const { contract_name, network = "testnet" } = args;

    try {
      const guide = deploymentService.generateDeploymentGuide(
        contract_name,
        network
      );

      const costs = deploymentService.estimateDeploymentCost();

      return {
        content: [
          {
            type: "text",
            text: `${guide}

## Estimated Costs

**Minimum Required:** ${costs.minRequired}
**Recommended:** ${costs.recommended}

**Breakdown:**
${Object.entries(costs.breakdown)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

Ready to deploy? Use \`deploy_contract\` tool!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to generate deployment guide: ${error}`,
          },
        ],
      };
    }
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

    // Search in ALL resource directories (not just how-to)
    const directories = [
      "smart-contracts",
      "how-to",
      "deployment",
      "tma",
      "frontend",
    ];

    // Try to find the file in each directory
    for (const dir of directories) {
      try {
        const content = await readMarkdownFromDirectory(dir, filename);
        if (content && content.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: `# ${filename} (from ${dir}/)\n\n${content}`,
              },
            ],
          };
        }
      } catch (error) {
        // Continue to next directory
        continue;
      }
    }

    // File not found in any directory - list all available resources
    const allAvailableResources: string[] = [];

    try {
      // Collect all available resources from all directories
      const fs = await import("fs");
      const path = await import("path");
      const resourcesPath = path.join(__dirname, "resources");

      for (const dir of directories) {
        const dirPath = path.join(resourcesPath, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          files.forEach((file) => {
            if (file.endsWith(".md") && file !== "README.md") {
              allAvailableResources.push(`${dir}/${file}`);
            }
          });
        }
      }
    } catch (error) {
      // Fallback to legacy method
      const howToFiles = getAvailableHowToResources();
      allAvailableResources.push(...howToFiles.map((f) => `how-to/${f}`));
    }

    return {
      content: [
        {
          type: "text",
          text: `❌ Resource '${filename}' not found in any directory.\n\n📚 Available resources (${
            allAvailableResources.length
          } files):\n\n${allAvailableResources
            .sort()
            .join(
              "\n"
            )}\n\n💡 Tip: Use the full filename or just the filename (e.g., "tolk_language_guide.md")`,
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

// CLI argument handling
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  TON MCP Server v${VERSION}                     ║
║        Complete Model Context Protocol for TON Blockchain      ║
╚════════════════════════════════════════════════════════════════╝

📖 DESCRIPTION:
   Production-grade MCP server providing AI assistants with comprehensive
   TON blockchain development tools, documentation, and live blockchain data.

🚀 USAGE:
   ton-mcp              Start MCP server (stdio mode for AI integration)
   ton-mcp --help       Show this help message

✨ CAPABILITIES:

   📚 Documentation (360+ pages indexed)
      • Complete docs.ton.org crawl with smart search
      • Tact, FunC, and Tolk language guides
      • Telegram Mini Apps (TMA) documentation
      • TON Connect and Jetton standards

   🛠️  18 MCP Tools Available:
      • search_ton_documentation       - Semantic search through all TON docs
      • get_account_info_live         - Live blockchain account data
      • get_transaction_history_live  - Recent transaction queries
      • get_jetton_info_live         - Token information
      • get_network_status_live      - Network statistics
      • generate_contract_code       - Smart contracts (Tact/FunC/Tolk)
      • generate_contract_wrapper    - TypeScript wrapper generation ⭐ NEW!
      • generate_test_file          - Sandbox test file generation ⭐ NEW!
      • generate_frontend_code       - Frontend guidance (official tools)
      • compile_tolk_contract        - Tolk → BOC compilation
      • validate_tolk_syntax         - Tolk code validation
      • generate_deployment_script   - Deployment automation
      • create_ton_project          - Project scaffolding (official tools)
      • deploy_contract             - Deploy to testnet/mainnet
      • check_deployment_status     - Verify deployments
      • get_deployment_guide        - Complete deployment docs
      • list_ton_resources          - Available resource files
      • get_specific_ton_resource   - Fetch specific guides

   💬 3 AI Prompts:
      • ton_development_guidance_prompt  - General TON development help
      • create_ton_smart_contract       - Smart contract creation workflow
      • create_ton_dapp                - DApp building guidance

   📂 4 Resource Categories:
      • smart-contracts/  - Contract templates, Tolk guide, TVM docs
      • how-to/          - Complete workflows, official tools guide
      • deployment/      - Deployment guide with cost estimates
      • tma/            - Telegram Mini App creation
      • frontend/        - Frontend integration guides

   🎯 Key Features:
      ✅ Tolk language support (newest TON language)
      ✅ 7 contract types (counter, jetton, NFT, DAO, AMM, staking, multisig)
      ✅ Official tool integration (Blueprint, @telegram-apps)
      ✅ Complete deployment system (testnet + mainnet)
      ✅ Live blockchain queries (accounts, transactions, Jettons)
      ✅ Project scaffolding with best practices
      ✅ Comprehensive error messages with troubleshooting

⚙️  CONFIGURATION:
   Environment variables (optional):
   • TON_NETWORK          mainnet | testnet (default: testnet)
   • TON_API_KEY          Your TON Center API key
   • TON_API_KEY_ENHANCED Your enhanced API key (optional)
   • DEBUG                true | false (default: false)

🔌 INTEGRATION:

   For Cursor IDE:
   1. Open Settings → Cursor Settings → MCP
   2. Add server:
      {
        "mcpServers": {
          "ton-mcp": {
            "command": "ton-mcp",
            "env": {
              "TON_NETWORK": "testnet",
              "DEBUG": "true"
            }
          }
        }
      }
   3. Restart Cursor
   4. Ask: "Search TON docs for Tact smart contracts"

   For Claude Code:
   Configure in your mcp.json with the same format above.

📚 DOCUMENTATION:
   • GitHub:  https://github.com/kunaldhongade/ton-mcp
   • npm:     https://www.npmjs.com/package/ton-mcp
   • AI Guide: See docs/general/AI_USAGE_GUIDE.md

💡 EXAMPLES:
   Ask your AI assistant:
   • "Search TON documentation for Jetton creation"
   • "Generate a Tact counter smart contract"
   • "How do I deploy a contract to testnet?"
   • "Create a Telegram Mini App with TON Connect"
   • "Show me the Tolk language guide"
   • "Get live account info for EQC8rU..."

🎉 QUICK START:
   1. Install: npm install -g ton-mcp
   2. Configure in Cursor/Claude (see INTEGRATION above)
   3. Restart your AI tool
   4. Start asking TON development questions!

📊 STATS:
   • Tools: 18        • Prompts: 3
   • Resources: 12+   • Documentation: 360+ pages
   • Languages: Tact, FunC, Tolk
   • Networks: Testnet & Mainnet

💬 CONTACT & SUPPORT:
   • GitHub Issues: https://github.com/kunaldhongade/ton-mcp/issues
   • Telegram: https://t.me/bossblock
   • Twitter/X: @kunaldhongade

Built with ❤️ by Kunal Dhongade for the TON ecosystem
`);
  process.exit(0);
}

// Start the server
const server = new TonMcpServer();
server.run().catch(console.error);
