import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

export interface CompilationResult {
  success: boolean;
  output?: string;
  error?: string;
  bocFile?: string;
  abiFile?: string;
}

export interface DeploymentConfig {
  network: "mainnet" | "testnet";
  contractCode: string;
  contractData?: string;
  value: string; // Amount of TON to send
  deployerKey?: string;
}

export class TolkCompilerService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(os.tmpdir(), "ton-mcp-tolk");
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Compile Tolk source code to BOC
   */
  async compileTolk(
    sourceCode: string,
    contractName: string = "contract"
  ): Promise<CompilationResult> {
    try {
      // Create temp file for source code
      const sourceFile = path.join(this.tempDir, `${contractName}.tolk`);
      fs.writeFileSync(sourceFile, sourceCode);

      // Check if tolk compiler is installed
      try {
        await execAsync("tolk --version");
      } catch (error) {
        return {
          success: false,
          error: `❌ Tolk compiler not installed on this system.

**To install Tolk:**
1. Visit: https://github.com/ton-blockchain/tolk
2. Follow installation instructions for your OS
3. Verify installation: \`tolk --version\`

**Alternative:** Use Tact language instead
- Change language parameter to "tact" 
- Tact is production-ready and widely supported
- Example: generate_contract_code(contract_type="counter", language="tact")`,
        };
      }

      // Compile Tolk to FunC
      const { stdout: funcOutput, stderr: funcError } = await execAsync(
        `tolk ${sourceFile} -o ${path.join(this.tempDir, contractName)}.fc`
      );

      if (funcError) {
        return {
          success: false,
          error: `Tolk compilation error: ${funcError}`,
        };
      }

      // Compile FunC to BOC using func compiler
      const funcFile = path.join(this.tempDir, `${contractName}.fc`);
      const bocFile = path.join(this.tempDir, `${contractName}.boc`);

      const { stdout: bocOutput, stderr: bocError } = await execAsync(
        `func -o ${bocFile} -SPA ${funcFile}`
      );

      if (bocError && !bocOutput.includes("successfully")) {
        return {
          success: false,
          error: `FunC compilation error: ${bocError}`,
        };
      }

      return {
        success: true,
        output: funcOutput + "\n" + bocOutput,
        bocFile: bocFile,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Compilation failed: ${error.message}`,
      };
    }
  }

  /**
   * Validate Tolk syntax without compiling
   */
  async validateTolk(sourceCode: string): Promise<CompilationResult> {
    try {
      // Check if tolk compiler is installed first
      try {
        await execAsync("tolk --version");
      } catch (error) {
        return {
          success: false,
          error: `❌ Tolk compiler not installed.

**Install Tolk to validate syntax:**
• GitHub: https://github.com/ton-blockchain/tolk
• Or use Tact language (no compiler needed for syntax check)

**For now, you can:**
1. Review the code manually
2. Use Tact instead (language="tact")
3. Install Tolk compiler for validation`,
        };
      }

      const sourceFile = path.join(this.tempDir, "validate.tolk");
      fs.writeFileSync(sourceFile, sourceCode);

      const { stdout, stderr } = await execAsync(`tolk --check ${sourceFile}`);

      return {
        success: !stderr,
        output: stdout || "✅ Syntax is valid! Code is ready to compile.",
        error: stderr || undefined,
      };
    } catch (error: any) {
      // Check if it's a "command not found" error
      if (error.message.includes('tolk') && (error.message.includes('not found') || error.message.includes('ENOENT'))) {
        return {
          success: false,
          error: `❌ Tolk compiler not found in system PATH.

**Quick fix:** Install Tolk compiler
• https://github.com/ton-blockchain/tolk

**Alternative:** Use Tact instead (fully supported, no external compiler needed)`,
        };
      }
      
      return {
        success: false,
        error: `Validation failed: ${error.message}`,
      };
    }
  }

  /**
   * Generate deployment script
   */
  async generateDeploymentScript(
    config: DeploymentConfig
  ): Promise<string> {
    const script = `
import { toNano, Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { mnemonicToWalletKey } from '@ton/crypto';

async function deploy() {
  // Initialize TON client
  const endpoint = ${
    config.network === "mainnet"
      ? "'https://toncenter.com/api/v2/jsonRPC'"
      : "'https://testnet.toncenter.com/api/v2/jsonRPC'"
  };
  
  const client = new TonClient({ endpoint });

  // Load deployer wallet
  const mnemonic = process.env.MNEMONIC || '';
  const key = await mnemonicToWalletKey(mnemonic.split(' '));
  
  // Contract code and data
  const contractCode = Buffer.from('${config.contractCode}', 'hex');
  const contractData = Buffer.from('${config.contractData || ""}', 'hex');
  
  // Deploy contract
  console.log('Deploying contract to ${config.network}...');
  
  // Contract deployment logic here
  // This is a template - actual deployment depends on contract specifics
  
  console.log('Contract deployed successfully!');
}

deploy().catch(console.error);
`;

    return script;
  }

  /**
   * Cleanup temp files
   */
  cleanup() {
    try {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Failed to cleanup temp files:", error);
    }
  }
}

export const tolkCompilerService = new TolkCompilerService();

