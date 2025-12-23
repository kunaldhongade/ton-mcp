/**
 * TypeScript Wrapper Generator for TON Contracts
 * Generates TypeScript wrappers from parsed contract data
 */

import { ParsedContract, ContractMethod } from './contract-parser.js';

export class WrapperGenerator {
  /**
   * Generate complete TypeScript wrapper
   */
  static generateWrapper(contract: ParsedContract): string {
    const className = contract.name;
    
    let wrapper = this.generateImports();
    wrapper += '\n';
    wrapper += this.generateInterface(contract);
    wrapper += '\n';
    wrapper += this.generateClass(contract);
    wrapper += '\n';
    wrapper += this.generateHelperFunctions(contract);
    
    return wrapper;
  }

  /**
   * Generate imports
   */
  private static generateImports(): string {
    return `import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
  toNano,
  TupleBuilder,
} from '@ton/core';

export type SendMode = number;
`;
  }

  /**
   * Generate config interface
   */
  private static generateInterface(contract: ParsedContract): string {
    const initMethod = contract.methods.find(m => m.type === 'init');
    
    if (!initMethod || initMethod.params.length === 0) {
      return `export interface ${contract.name}Config {
  // Add your config here
}
`;
    }

    let interfaceCode = `export interface ${contract.name}Config {\n`;
    for (const param of initMethod.params) {
      const tsType = this.mapTypeToTypeScript(param.type);
      interfaceCode += `  ${param.name}: ${tsType};\n`;
    }
    interfaceCode += '}\n';
    
    return interfaceCode;
  }

  /**
   * Generate main class
   */
  private static generateClass(contract: ParsedContract): string {
    const className = contract.name;
    
    let classCode = `export class ${className} implements Contract {\n`;
    classCode += `  constructor(\n`;
    classCode += `    readonly address: Address,\n`;
    classCode += `    readonly init?: { code: Cell; data: Cell }\n`;
    classCode += `  ) {}\n\n`;
    
    // Static factory method
    classCode += `  static createFromAddress(address: Address) {\n`;
    classCode += `    return new ${className}(address);\n`;
    classCode += `  }\n\n`;
    
    // Static create method with config
    classCode += `  static createFromConfig(config: ${className}Config, code: Cell, workchain = 0) {\n`;
    classCode += `    const data = ${this.generateDataCell(contract)};\n`;
    classCode += `    const init = { code, data };\n`;
    classCode += `    return new ${className}(contractAddress(workchain, init), init);\n`;
    classCode += `  }\n\n`;
    
    // Send deployment method
    classCode += `  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {\n`;
    classCode += `    await provider.internal(via, {\n`;
    classCode += `      value,\n`;
    classCode += `      sendMode: SendMode.PAY_GAS_SEPARATELY,\n`;
    classCode += `      body: beginCell().endCell(),\n`;
    classCode += `    });\n`;
    classCode += `  }\n\n`;
    
    // Generate send methods for each receive
    const receiveMethods = contract.methods.filter(m => m.type === 'receive');
    for (const method of receiveMethods) {
      classCode += this.generateSendMethod(method, contract);
    }
    
    // Generate get methods
    const getMethods = contract.methods.filter(m => m.type === 'get');
    for (const method of getMethods) {
      classCode += this.generateGetMethod(method);
    }
    
    classCode += '}\n';
    
    return classCode;
  }

  /**
   * Generate send method for receive messages
   */
  private static generateSendMethod(method: ContractMethod, contract: ParsedContract): string {
    const methodName = `send${this.capitalize(method.name)}`;
    const params = method.params.filter(p => !['my_balance', 'msg_value', 'in_msg_full', 'in_msg_body', 'in_msg'].includes(p.name));
    
    let methodCode = `  async ${methodName}(\n`;
    methodCode += `    provider: ContractProvider,\n`;
    methodCode += `    via: Sender,\n`;
    methodCode += `    opts: {\n`;
    methodCode += `      value: bigint;\n`;
    methodCode += `      bounce?: boolean;\n`;
    
    for (const param of params) {
      const tsType = this.mapTypeToTypeScript(param.type);
      methodCode += `      ${param.name}: ${tsType};\n`;
    }
    
    methodCode += `    }\n`;
    methodCode += `  ) {\n`;
    
    // Build message body
    if (contract.language === 'tact') {
      // Tact uses string messages or typed messages
      if (params.length === 0 && typeof method.name === 'string' && method.name.length < 20) {
        // Simple string message
        methodCode += `    await provider.internal(via, {\n`;
        methodCode += `      value: opts.value,\n`;
        methodCode += `      sendMode: SendMode.PAY_GAS_SEPARATELY,\n`;
        methodCode += `      body: beginCell().storeUint(0, 32).storeStringTail("${method.name}").endCell(),\n`;
        methodCode += `    });\n`;
      } else {
        // Typed message with opcode
        const opcode = method.opcode || 0;
        methodCode += `    const body = beginCell()\n`;
        methodCode += `      .storeUint(${opcode}, 32) // opcode\n`;
        
        for (const param of params) {
          methodCode += `      ${this.generateStoreOperation(param)}\n`;
        }
        
        methodCode += `      .endCell();\n\n`;
        methodCode += `    await provider.internal(via, {\n`;
        methodCode += `      value: opts.value,\n`;
        methodCode += `      sendMode: SendMode.PAY_GAS_SEPARATELY,\n`;
        methodCode += `      body,\n`;
        methodCode += `    });\n`;
      }
    } else {
      // FunC/Tolk use opcode-based messages
      const opcode = method.opcode || this.inferOpcodeFromName(method.name);
      methodCode += `    const body = beginCell()\n`;
      methodCode += `      .storeUint(${opcode}, 32) // opcode\n`;
      methodCode += `      .storeUint(0, 64) // query_id\n`;
      
      for (const param of params) {
        methodCode += `      ${this.generateStoreOperation(param)}\n`;
      }
      
      methodCode += `      .endCell();\n\n`;
      methodCode += `    await provider.internal(via, {\n`;
      methodCode += `      value: opts.value,\n`;
      methodCode += `      sendMode: SendMode.PAY_GAS_SEPARATELY,\n`;
      methodCode += `      body,\n`;
      methodCode += `    });\n`;
    }
    
    methodCode += `  }\n\n`;
    
    return methodCode;
  }

  /**
   * Generate get method
   */
  private static generateGetMethod(method: ContractMethod): string {
    const methodName = `get${this.capitalize(method.name)}`;
    const returnType = this.mapTypeToTypeScript(method.returnType || 'any');
    
    let methodCode = `  async ${methodName}(provider: ContractProvider`;
    
    // Add parameters if any
    if (method.params && method.params.length > 0) {
      for (const param of method.params) {
        const tsType = this.mapTypeToTypeScript(param.type);
        methodCode += `, ${param.name}: ${tsType}`;
      }
    }
    
    methodCode += `): Promise<${returnType}> {\n`;
    methodCode += `    const result = await provider.get('${method.name}', [`;
    
    // Add tuple builder for params
    if (method.params && method.params.length > 0) {
      methodCode += `\n      `;
      for (let i = 0; i < method.params.length; i++) {
        const param = method.params[i];
        methodCode += this.generateTupleItem(param);
        if (i < method.params.length - 1) {
          methodCode += ',\n      ';
        }
      }
      methodCode += `\n    `;
    }
    
    methodCode += `]);\n`;
    methodCode += `    return ${this.generateStackRead(method.returnType || 'int')};\n`;
    methodCode += `  }\n\n`;
    
    return methodCode;
  }

  /**
   * Generate data cell initialization
   */
  private static generateDataCell(contract: ParsedContract): string {
    const initMethod = contract.methods.find(m => m.type === 'init');
    
    if (!initMethod || initMethod.params.length === 0) {
      return 'beginCell().endCell()';
    }

    let dataCode = 'beginCell()\n';
    for (const param of initMethod.params) {
      dataCode += `      ${this.generateStoreOperation(param)}\n`;
    }
    dataCode += '      .endCell()';
    
    return dataCode;
  }

  /**
   * Generate store operation for a parameter
   */
  private static generateStoreOperation(param: { name: string; type: string }): string {
    const type = param.type.toLowerCase();
    
    if (type.includes('int') || type === 'number') {
      return `.storeUint(opts.${param.name}, 32)`;
    } else if (type.includes('address')) {
      return `.storeAddress(opts.${param.name})`;
    } else if (type.includes('bool')) {
      return `.storeBit(opts.${param.name})`;
    } else if (type.includes('string')) {
      return `.storeStringTail(opts.${param.name})`;
    } else if (type.includes('cell')) {
      return `.storeRef(opts.${param.name})`;
    } else if (type.includes('coins') || type.includes('bigint')) {
      return `.storeCoins(opts.${param.name})`;
    } else if (type.includes('slice')) {
      return `.storeSlice(opts.${param.name})`;
    }
    
    // Default to uint
    return `.storeUint(opts.${param.name}, 32)`;
  }

  /**
   * Generate tuple item for parameters
   */
  private static generateTupleItem(param: { name: string; type: string }): string {
    const type = param.type.toLowerCase();
    
    if (type.includes('address')) {
      return `{ type: 'slice', cell: beginCell().storeAddress(${param.name}).endCell() }`;
    } else if (type.includes('int')) {
      return `{ type: 'int', value: BigInt(${param.name}) }`;
    } else if (type.includes('cell')) {
      return `{ type: 'cell', cell: ${param.name} }`;
    }
    
    return `{ type: 'int', value: BigInt(${param.name}) }`;
  }

  /**
   * Generate stack read operation
   */
  private static generateStackRead(returnType: string): string {
    const type = returnType.toLowerCase();
    
    if (type.includes('int') || type === 'number') {
      return 'result.stack.readNumber()';
    } else if (type.includes('bigint') || type.includes('coins')) {
      return 'result.stack.readBigNumber()';
    } else if (type.includes('bool')) {
      return 'result.stack.readBoolean()';
    } else if (type.includes('address')) {
      return 'result.stack.readAddress()';
    } else if (type.includes('cell')) {
      return 'result.stack.readCell()';
    } else if (type.includes('tuple')) {
      return 'result.stack.readTuple()';
    }
    
    return 'result.stack.readNumber()';
  }

  /**
   * Generate helper functions
   */
  private static generateHelperFunctions(contract: ParsedContract): string {
    return `// Helper functions
export function ${contract.name.toLowerCase()}ConfigToCell(config: ${contract.name}Config): Cell {
  return beginCell()
    // Add your config serialization here
    .endCell();
}
`;
  }

  /**
   * Map contract type to TypeScript type
   */
  private static mapTypeToTypeScript(type: string): string {
    const typeMap: Record<string, string> = {
      'Int': 'bigint',
      'int': 'bigint',
      'Bool': 'boolean',
      'bool': 'boolean',
      'Address': 'Address',
      'address': 'Address',
      'String': 'string',
      'string': 'string',
      'Cell': 'Cell',
      'cell': 'Cell',
      'Slice': 'Cell',
      'slice': 'Cell',
      'Builder': 'Cell',
      'builder': 'Cell',
      'Tuple': 'any[]',
      'tuple': 'any[]',
    };

    return typeMap[type] || 'any';
  }

  /**
   * Capitalize first letter
   */
  private static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Infer opcode from method name
   */
  private static inferOpcodeFromName(name: string): number {
    const opcodeMap: Record<string, number> = {
      'increment': 1,
      'decrement': 2,
      'mint': 21,
      'burn': 22,
      'transfer': 0x5fcc3d14,
      'stake': 1,
      'unstake': 2,
      'claim': 3,
      'addLiquidity': 1,
      'removeLiquidity': 2,
      'swap': 3,
      'recv_internal': 0,
      'recv_external': 0,
    };

    return opcodeMap[name] || 0;
  }
}

