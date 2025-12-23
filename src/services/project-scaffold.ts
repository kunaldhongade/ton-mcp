import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ScaffoldConfig {
  projectName: string;
  projectType: "smart-contract" | "tma" | "dapp-fullstack";
  language?: "tolk" | "tact" | "func";
  includeTests?: boolean;
  includeFrontend?: boolean;
  framework?: "react" | "next" | "vanilla";
}

export interface ProjectStructure {
  success: boolean;
  projectPath: string;
  commands: string[];
  message: string;
  officialTool: string;
  nextSteps: string[];
}

/**
 * Project Scaffold Service using Official TON Tools
 *
 * Uses:
 * - Blueprint (npm create ton@latest) for smart contracts
 * - @telegram-apps/create-mini-app for TMAs
 */
export class ProjectScaffoldService {
  /**
   * Create a TON smart contract project using official Blueprint
   * https://github.com/ton-org/blueprint
   */
  async createSmartContractProject(
    config: ScaffoldConfig
  ): Promise<ProjectStructure> {
    const { projectName, language = "tact" } = config;

    return {
      success: true,
      projectPath: `./${projectName}`,
      commands: [
        `npm create ton@latest ${projectName}`,
        `cd ${projectName}`,
        "npm install",
        "npm run build",
        "npm test",
      ],
      message: `✅ **Blueprint Smart Contract Project**

**Official Tool:** \`npm create ton@latest\`
**Project:** ${projectName}
**Language:** ${language.toUpperCase()}

**What Blueprint Provides:**
- ✅ Project scaffolding with best practices
- ✅ TypeScript wrappers for contracts
- ✅ Sandbox testing environment
- ✅ Deployment scripts (mainnet & testnet)
- ✅ Build system for ${language}

**Project Structure:**
\`\`\`
${projectName}/
├── contracts/      # Smart contract source
├── wrappers/       # TypeScript wrappers
├── tests/          # Sandbox tests
├── scripts/        # Deployment scripts
└── build/          # Compiled contracts
\`\`\``,
      officialTool: "Blueprint (npm create ton@latest)",
      nextSteps: [
        `Run: npm create ton@latest ${projectName}`,
        `Select: ${language} as contract language`,
        `cd ${projectName} && npm install`,
        "npm run build (compile contract)",
        "npm test (run tests)",
        "npm run deploy (deploy to blockchain)",
      ],
    };
  }

  /**
   * Create a Telegram Mini App using official tool
   * https://github.com/telegram-apps/create-mini-app
   */
  async createTMAProject(config: ScaffoldConfig): Promise<ProjectStructure> {
    const { projectName, framework = "react" } = config;

    return {
      success: true,
      projectPath: `./${projectName}`,
      commands: [
        `npx @telegram-apps/create-mini-app@latest`,
        // User will be prompted for: project name, template, package manager
      ],
      message: `✅ **Telegram Mini App Project**

**Official Tool:** \`@telegram-apps/create-mini-app\`
**Project:** ${projectName}
**Framework:** ${framework.toUpperCase()}

**What This Tool Provides:**
- ✅ Modern TMA templates (React, Vue, Vanilla)
- ✅ TON Connect integration
- ✅ Telegram WebApp SDK
- ✅ TypeScript support
- ✅ Vite build system
- ✅ Ready-to-deploy structure

**Available Templates:**
- React (recommended)
- React + TypeScript
- Next.js
- Vue
- Vanilla JavaScript

**Features Included:**
- 🔗 TON Connect wallet integration
- 📱 Telegram WebApp API
- ⚡ Fast development with HMR
- 🎨 Modern UI components`,
      officialTool: "@telegram-apps/create-mini-app",
      nextSteps: [
        "Run: npx @telegram-apps/create-mini-app@latest",
        `Enter project name: ${projectName}`,
        `Select template: ${framework}`,
        "Choose package manager: npm",
        `cd ${projectName} && npm install`,
        "npm run dev (start development)",
        "Configure tonconnect-manifest.json",
        "Deploy to hosting (Vercel/Netlify/GitHub Pages)",
      ],
    };
  }

  /**
   * Create a full-stack dApp (Smart Contract + TMA)
   */
  async createFullStackProject(
    config: ScaffoldConfig
  ): Promise<ProjectStructure> {
    const { projectName, language = "tact", framework = "react" } = config;

    return {
      success: true,
      projectPath: `./${projectName}`,
      commands: [
        `mkdir ${projectName}`,
        `cd ${projectName}`,
        "# Create contracts",
        `npm create ton@latest contracts`,
        "# Create frontend",
        `npx @telegram-apps/create-mini-app@latest frontend`,
      ],
      message: `✅ **Full-Stack TON dApp**

**Project:** ${projectName}
**Backend:** ${language.toUpperCase()} Smart Contracts (Blueprint)
**Frontend:** ${framework.toUpperCase()} TMA (@telegram-apps)

**Using Official Tools:**
1. **Blueprint** - for smart contracts
2. **@telegram-apps/create-mini-app** - for frontend

**Recommended Structure:**
\`\`\`
${projectName}/
├── contracts/          # Blueprint project
│   ├── contracts/      # Smart contracts
│   ├── wrappers/       # TypeScript wrappers
│   ├── tests/          # Tests
│   └── scripts/        # Deployment
├── frontend/           # TMA project
│   ├── src/            # React/Vue source
│   ├── public/         # Static assets
│   └── package.json
└── README.md
\`\`\`

**Development Workflow:**
1. Develop contracts in \`contracts/\`
2. Test with \`npm test\`
3. Deploy contracts to testnet
4. Update frontend with contract address
5. Integrate contract in TMA
6. Deploy frontend`,
      officialTool: "Blueprint + @telegram-apps/create-mini-app",
      nextSteps: [
        `mkdir ${projectName} && cd ${projectName}`,
        "# Step 1: Create contracts",
        "npm create ton@latest contracts",
        "Select contract language",
        "cd contracts && npm install",
        "",
        "# Step 2: Create frontend",
        "cd ..",
        "npx @telegram-apps/create-mini-app@latest frontend",
        "Select React template",
        "cd frontend && npm install",
        "",
        "# Step 3: Connect them",
        "Deploy contracts: cd contracts && npm run deploy",
        "Copy contract address",
        "Update frontend with contract address",
        "Test integration",
        "Deploy frontend",
      ],
    };
  }

  /**
   * Get detailed guide for using official tools
   */
  getOfficialToolsGuide(projectType: string): string {
    if (projectType === "smart-contract") {
      return `# Blueprint Smart Contract Guide

## Quick Start
\`\`\`bash
npm create ton@latest my-project
cd my-project
npm install
npm run build
npm test
\`\`\`

## What You Get
- **Project scaffolding** with best practices
- **Build system** for Tact/FunC
- **Testing environment** with Sandbox
- **Deployment scripts** for mainnet/testnet
- **TypeScript wrappers** for contract interaction

## Development Workflow
1. Write contract in \`contracts/\`
2. Build: \`npm run build\`
3. Test: \`npm test\`
4. Deploy: \`npm run deploy\`

## Available Commands
- \`npm run build\` - Compile contracts
- \`npm test\` - Run tests
- \`npm run deploy\` - Deploy to mainnet
- \`npm run deploy:testnet\` - Deploy to testnet

## Documentation
- https://github.com/ton-org/blueprint
- https://docs.ton.org/develop/smart-contracts/
`;
    } else if (projectType === "tma") {
      return `# Telegram Mini App Guide

## Quick Start
\`\`\`bash
npx @telegram-apps/create-mini-app@latest
# Follow prompts:
# - Enter project name
# - Select template (React recommended)
# - Choose package manager
cd my-tma
npm install
npm run dev
\`\`\`

## What You Get
- **Modern templates** (React, Vue, Vanilla)
- **TON Connect** integration
- **Telegram WebApp SDK** configured
- **Vite** build system
- **TypeScript** support
- **Production-ready** structure

## Development Workflow
1. Develop in \`src/\`
2. Test: \`npm run dev\`
3. Build: \`npm run build\`
4. Deploy to hosting

## TON Connect Setup
1. Update \`public/tonconnect-manifest.json\`:
\`\`\`json
{
  "url": "https://yourdomain.com",
  "name": "My TMA",
  "iconUrl": "https://yourdomain.com/icon.png"
}
\`\`\`

## Telegram Bot Setup
1. Create bot: https://t.me/BotFather
2. Run \`/newbot\` and follow prompts
3. Set Web App URL: \`/setmenubutton\`
4. Enter your deployed URL

## Documentation
- https://github.com/telegram-apps/create-mini-app
- https://docs.ton.org/develop/dapps/telegram-apps/
- https://core.telegram.org/bots/webapps
`;
    }

    return `# Full-Stack dApp Guide

## Quick Start
\`\`\`bash
# 1. Create project folder
mkdir my-dapp && cd my-dapp

# 2. Create contracts
npm create ton@latest contracts
cd contracts && npm install && cd ..

# 3. Create frontend
npx @telegram-apps/create-mini-app@latest frontend
cd frontend && npm install && cd ..
\`\`\`

## Integration Steps

### 1. Deploy Contracts
\`\`\`bash
cd contracts
npm run deploy:testnet
# Copy contract address from output
\`\`\`

### 2. Update Frontend
\`\`\`typescript
// frontend/src/config.ts
export const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS';
\`\`\`

### 3. Import Contract Wrapper
\`\`\`typescript
// Copy from contracts/wrappers/
import { YourContract } from './contracts/YourContract';
\`\`\`

### 4. Interact with Contract
\`\`\`typescript
import { useTonClient } from '@tonconnect/ui-react';

const client = useTonClient();
const contract = client.open(YourContract.createFromAddress(...));
await contract.sendMessage();
\`\`\`

## Development Workflow
1. Develop contracts
2. Test contracts locally
3. Deploy to testnet
4. Update frontend
5. Test integration
6. Deploy frontend
7. Test in Telegram
8. Deploy to mainnet

## Documentation
- Smart Contracts: https://docs.ton.org/develop/smart-contracts/
- TMAs: https://docs.ton.org/develop/dapps/telegram-apps/
- TON Connect: https://docs.ton.org/develop/dapps/ton-connect/
`;
  }

  /**
   * Execute project creation (actually runs the commands)
   */
  async executeProjectCreation(
    config: ScaffoldConfig,
    targetDirectory: string = process.cwd()
  ): Promise<{
    success: boolean;
    output: string;
    error?: string;
    command?: string;
  }> {
    try {
      if (config.projectType === "smart-contract") {
        // Run Blueprint - can be executed programmatically
        const command = `npm create ton@latest ${config.projectName} -- --yes`;
        try {
          const { stdout, stderr } = await execAsync(
            command,
            { cwd: targetDirectory, timeout: 60000 } // 60 second timeout
          );
          return {
            success: true,
            output: stdout || stderr,
            command,
          };
        } catch (execError: any) {
          // If execution fails, provide manual instructions
          return {
            success: false,
            output: "",
            error: execError.message,
            command: `npm create ton@latest ${config.projectName}`,
          };
        }
      } else if (config.projectType === "tma") {
        // Guide user - @telegram-apps/create-mini-app is interactive
        return {
          success: true,
          output: `**Interactive Tool - Run Manually**

The \`@telegram-apps/create-mini-app\` tool is interactive and requires user input.

**Run this command:**
\`\`\`bash
npx @telegram-apps/create-mini-app@latest
\`\`\`

**Follow the prompts:**
1. Project name: ${config.projectName}
2. Template: ${
            config.framework === "react"
              ? "React"
              : config.framework === "next"
              ? "Next.js"
              : "Vanilla"
          }
3. Package manager: npm

**After creation:**
\`\`\`bash
cd ${config.projectName}
npm install
npm run dev
\`\`\``,
          command: `npx @telegram-apps/create-mini-app@latest`,
        };
      } else {
        // Full-stack: guide through both tools
        return {
          success: true,
          output: `**Full-Stack Project Setup**

**Step 1: Create project folder**
\`\`\`bash
mkdir ${config.projectName}
cd ${config.projectName}
\`\`\`

**Step 2: Create smart contracts (Blueprint)**
\`\`\`bash
npm create ton@latest contracts
cd contracts
npm install
cd ..
\`\`\`

**Step 3: Create frontend (TMA)**
\`\`\`bash
npx @telegram-apps/create-mini-app@latest frontend
# Follow prompts, select ${config.framework} template
cd frontend
npm install
cd ..
\`\`\`

**Step 4: Connect them**
- Deploy contracts: \`cd contracts && npm run deploy:testnet\`
- Copy contract address
- Update frontend with contract address
- Test integration`,
          command: `mkdir ${config.projectName} && cd ${config.projectName} && npm create ton@latest contracts && npx @telegram-apps/create-mini-app@latest frontend`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        output: "",
        error: error.message,
      };
    }
  }
}

export const projectScaffoldService = new ProjectScaffoldService();
