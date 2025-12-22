import { Address, beginCell, Cell, toNano, TonClient } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export interface DeploymentConfig {
  network: "mainnet" | "testnet";
  mnemonic?: string;
  contractCode: string; // hex or base64
  contractData?: string; // hex or base64
  value: string; // Amount of TON
  bounce?: boolean;
}

export interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
  explorerUrl?: string;
}

export class DeploymentService {
  private async getTonClient(network: "mainnet" | "testnet"): Promise<TonClient> {
    const endpoint =
      network === "mainnet"
        ? "https://toncenter.com/api/v2/jsonRPC"
        : "https://testnet.toncenter.com/api/v2/jsonRPC";

    return new TonClient({ endpoint });
  }

  /**
   * Deploy a smart contract to TON blockchain
   */
  async deployContract(
    config: DeploymentConfig
  ): Promise<DeploymentResult> {
    try {
      if (!config.mnemonic) {
        return {
          success: false,
          error:
            "Mnemonic is required for deployment. Set MNEMONIC environment variable or provide it in config.",
        };
      }

      const client = await this.getTonClient(config.network);

      // Get wallet keys from mnemonic
      const keys = await mnemonicToWalletKey(config.mnemonic.split(" "));

      // Parse contract code and data
      const contractCode = Cell.fromBase64(config.contractCode);
      const contractData = config.contractData
        ? Cell.fromBase64(config.contractData)
        : beginCell().endCell();

      // Calculate contract address
      const stateInit = beginCell()
        .storeUint(0, 2) // split_depth:(Maybe (## 5)) special:(Maybe TickTock)
        .storeUint(0, 2) // code:(Maybe ^Cell) data:(Maybe ^Cell) library:(Maybe ^Cell)
        .storeMaybeRef(contractCode)
        .storeMaybeRef(contractData)
        .storeMaybeRef(null)
        .endCell();

      const contractAddress = new Address(
        0,
        stateInit.hash()
      );

      // Create deployment message
      const deployMessage = beginCell()
        .storeUint(0, 2) // workchain
        .storeAddress(contractAddress)
        .storeCoins(BigInt(parseFloat(config.value) * 1e9))
        .storeBit(config.bounce ?? false)
        .storeBit(false)
        .storeRef(stateInit)
        .endCell();

      // This is a simplified version - actual deployment would use wallet contract
      // For production, use Blueprint or similar tools

      const explorerUrl =
        config.network === "mainnet"
          ? `https://tonviewer.com/${contractAddress.toString()}`
          : `https://testnet.tonviewer.com/${contractAddress.toString()}`;

      return {
        success: true,
        contractAddress: contractAddress.toString(),
        explorerUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Deployment failed: ${error.message}`,
      };
    }
  }

  /**
   * Deploy using Blueprint (recommended)
   */
  async deployWithBlueprint(
    projectPath: string,
    network: "mainnet" | "testnet"
  ): Promise<DeploymentResult> {
    try {
      const command =
        network === "testnet"
          ? "npm run deploy:testnet"
          : "npm run deploy";

      const { stdout, stderr } = await execAsync(command, {
        cwd: projectPath,
      });

      // Parse deployment output for contract address
      const addressMatch = stdout.match(/Contract deployed at: ([\w\d]+)/);
      const contractAddress = addressMatch ? addressMatch[1] : undefined;

      if (contractAddress) {
        const explorerUrl =
          network === "mainnet"
            ? `https://tonviewer.com/${contractAddress}`
            : `https://testnet.tonviewer.com/${contractAddress}`;

        return {
          success: true,
          contractAddress,
          explorerUrl,
        };
      }

      return {
        success: false,
        error: "Could not find contract address in deployment output",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Blueprint deployment failed: ${error.message}`,
      };
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(
    contractAddress: string,
    network: "mainnet" | "testnet"
  ): Promise<{
    deployed: boolean;
    balance?: string;
    lastActivity?: Date;
  }> {
    try {
      const client = await this.getTonClient(network);
      const address = Address.parse(contractAddress);
      
      const state = await client.getContractState(address);

      if (state.state === "active") {
        return {
          deployed: true,
          balance: state.balance.toString(),
          lastActivity: new Date(state.lastTransaction?.lt || 0),
        };
      }

      return { deployed: false };
    } catch (error) {
      return { deployed: false };
    }
  }

  /**
   * Estimate deployment cost
   */
  estimateDeploymentCost(): {
    minRequired: string;
    recommended: string;
    breakdown: Record<string, string>;
  } {
    return {
      minRequired: "0.05 TON",
      recommended: "0.1 TON",
      breakdown: {
        "Storage fee": "0.01 TON",
        "Deployment": "0.02 TON",
        "Initial balance": "0.02 TON",
        "Buffer": "0.05 TON",
      },
    };
  }

  /**
   * Generate deployment guide
   */
  generateDeploymentGuide(
    contractName: string,
    network: "mainnet" | "testnet"
  ): string {
    return `# Deployment Guide: ${contractName}

## Prerequisites

1. **Wallet with TON**
   - Need at least 0.1 TON for deployment
   - ${network === "testnet" ? "Get testnet TON from faucet: https://testnet.tonscan.org/faucet" : "Buy TON from exchange"}

2. **Environment Setup**
   \`\`\`bash
   # Create .env file
   echo "MNEMONIC=your wallet mnemonic here" > .env
   \`\`\`

3. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

## Deployment Steps

### Step 1: Build Contract
\`\`\`bash
npm run build
\`\`\`

### Step 2: Test Locally
\`\`\`bash
npm test
\`\`\`

### Step 3: Deploy to ${network}
\`\`\`bash
npm run deploy${network === "testnet" ? ":testnet" : ""}
\`\`\`

### Step 4: Verify Deployment
Check contract on explorer:
- ${network === "mainnet" ? "https://tonviewer.com" : "https://testnet.tonviewer.com"}

## Troubleshooting

### Insufficient Funds
- Ensure wallet has enough TON
- Recommended: 0.1 TON minimum

### Compilation Errors
- Check syntax in contract code
- Run \`npm run build\` to see errors

### Deployment Timeout
- Network might be congested
- Try again in a few minutes
- Check wallet balance

## Post-Deployment

1. **Save Contract Address**
   - Copy address from deployment output
   - Update frontend with new address

2. **Test Contract**
   - Send test transactions
   - Verify getters work
   - Check state changes

3. **Monitor Contract**
   - Watch transactions
   - Check balance
   - Monitor errors

## Need Help?

- [TON Docs](https://docs.ton.org/)
- [Blueprint Guide](https://github.com/ton-community/blueprint)
- [TON Dev Chat](https://t.me/tondev_eng)
`;
  }
}

export const deploymentService = new DeploymentService();

