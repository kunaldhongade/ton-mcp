/**
 * Test File Generator for TON Smart Contracts
 * Generates test files compatible with Blueprint's Sandbox testing environment
 */

export interface TestConfig {
  contractName: string;
  language: "tact" | "func" | "tolk";
  methods: Array<{
    name: string;
    type: "receive" | "get";
    params?: Array<{ name: string; type: string }>;
    returnType?: string;
  }>;
}

export class TestGenerator {
  /**
   * Generate complete test file for Blueprint/Sandbox
   */
  static generateTestFile(config: TestConfig): string {
    const { contractName, language, methods } = config;

    let testCode = `import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { ${contractName} } from '../wrappers/${contractName}';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('${contractName}', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let ${contractName.toLowerCase()}: SandboxContract<${contractName}>;

    beforeAll(async () => {
        // Compile contract
        code = await compile('${contractName}');
    });

    beforeEach(async () => {
        // Create blockchain instance
        blockchain = await Blockchain.create();

        // Create deployer wallet
        deployer = await blockchain.treasury('deployer');

        // Deploy contract
        ${contractName.toLowerCase()} = blockchain.openContract(
            ${contractName}.createFromConfig(
                {
                    // Add your init config here
                },
                code
            )
        );

        // Send deploy transaction
        const deployResult = await ${contractName.toLowerCase()}.sendDeploy(
            deployer.getSender(),
            toNano('0.05')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: ${contractName.toLowerCase()}.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // Contract should be deployed
        expect(await ${contractName.toLowerCase()}.getDeployStatus()).toBe(true);
    });
`;

    // Generate tests for get methods
    const getMethods = methods.filter((m) => m.type === "get");
    for (const method of getMethods) {
      testCode += this.generateGetMethodTest(contractName, method);
    }

    // Generate tests for receive methods
    const receiveMethods = methods.filter((m) => m.type === "receive");
    for (const method of receiveMethods) {
      testCode += this.generateReceiveMethodTest(contractName, method);
    }

    testCode += `});\n`;

    return testCode;
  }

  /**
   * Generate test for get method
   */
  private static generateGetMethodTest(
    contractName: string,
    method: { name: string; returnType?: string }
  ): string {
    const contractVar = contractName.toLowerCase();
    const methodName = method.name;
    const returnType = method.returnType || "bigint";

    return `
    it('should get ${methodName}', async () => {
        const result = await ${contractVar}.get${this.capitalize(methodName)}();
        expect(result).toBeDefined();
        ${this.generateTypeAssertion(returnType, "result")}
    });
`;
  }

  /**
   * Generate test for receive method
   */
  private static generateReceiveMethodTest(
    contractName: string,
    method: { name: string; params?: Array<{ name: string; type: string }> }
  ): string {
    const contractVar = contractName.toLowerCase();
    const methodName = method.name;
    const sendMethodName = `send${this.capitalize(methodName)}`;

    return `
    it('should handle ${methodName}', async () => {
        const result = await ${contractVar}.${sendMethodName}(
            deployer.getSender(),
            {
                value: toNano('0.05'),
                bounce: false,
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: ${contractVar}.address,
            success: true,
        });
    });
`;
  }

  /**
   * Generate type assertion
   */
  private static generateTypeAssertion(type: string, value: string): string {
    const normalizedType = type.toLowerCase();

    if (normalizedType.includes("int") || normalizedType.includes("bigint")) {
      return `expect(typeof ${value}).toBe('bigint');`;
    } else if (normalizedType.includes("bool")) {
      return `expect(typeof ${value}).toBe('boolean');`;
    } else if (normalizedType.includes("string")) {
      return `expect(typeof ${value}).toBe('string');`;
    } else if (normalizedType.includes("address")) {
      return `expect(${value}).toBeInstanceOf(Address);`;
    } else {
      return `expect(${value}).toBeDefined();`;
    }
  }

  /**
   * Capitalize first letter
   */
  private static capitalize(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate package.json test script section
   */
  static generateTestScripts(): string {
    return `{
  "scripts": {
    "test": "blueprint test",
    "test:watch": "blueprint test --watch",
    "test:coverage": "blueprint test --coverage"
  }
}`;
  }

  /**
   * Generate Jest config for Blueprint
   */
  static generateJestConfig(): string {
    return `import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
        'wrappers/**/*.ts',
        '!wrappers/**/*.test.ts',
    ],
};

export default config;
`;
  }

  /**
   * Generate example test for Counter contract
   */
  static generateCounterExample(): string {
    return `import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Counter } from '../wrappers/Counter';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Counter', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let counter: SandboxContract<Counter>;

    beforeAll(async () => {
        code = await compile('Counter');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        counter = blockchain.openContract(
            Counter.createFromConfig({}, code)
        );

        const deployResult = await counter.sendDeploy(
            deployer.getSender(),
            toNano('0.05')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: counter.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // Contract should be deployed
        const counterValue = await counter.getCounter();
        expect(counterValue).toBe(0n);
    });

    it('should increment', async () => {
        const initialValue = await counter.getCounter();
        expect(initialValue).toBe(0n);

        // Send increment message
        const result = await counter.sendIncrement(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: counter.address,
            success: true,
        });

        // Check counter increased
        const newValue = await counter.getCounter();
        expect(newValue).toBe(1n);
    });

    it('should decrement', async () => {
        // First increment
        await counter.sendIncrement(deployer.getSender(), {
            value: toNano('0.05'),
        });

        // Then decrement
        const result = await counter.sendDecrement(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: counter.address,
            success: true,
        });

        // Check counter decreased
        const newValue = await counter.getCounter();
        expect(newValue).toBe(0n);
    });
});
`;
  }
}
