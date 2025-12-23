/**
 * Contract Parser for TON Smart Contracts
 * Parses Tact, FunC, and Tolk contracts to extract methods and types
 */

export interface ContractMethod {
  name: string;
  type: "receive" | "get" | "init";
  params: MethodParam[];
  returnType?: string;
  isPayable?: boolean;
  opcode?: number;
}

export interface MethodParam {
  name: string;
  type: string;
}

export interface ParsedContract {
  name: string;
  language: "tact" | "func" | "tolk";
  methods: ContractMethod[];
  stateVariables: StateVariable[];
}

export interface StateVariable {
  name: string;
  type: string;
}

export class ContractParser {
  /**
   * Parse contract code and extract structure
   */
  static parseContract(code: string, language: string): ParsedContract {
    const normalizedLang = language.toLowerCase();

    switch (normalizedLang) {
      case "tact":
        return this.parseTactContract(code);
      case "func":
      case "funC":
        return this.parseFuncContract(code);
      case "tolk":
        return this.parseTolkContract(code);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Parse Tact contract
   */
  private static parseTactContract(code: string): ParsedContract {
    const methods: ContractMethod[] = [];
    const stateVariables: StateVariable[] = [];

    // Extract contract name
    const contractNameMatch = code.match(/contract\s+(\w+)/);
    const contractName = contractNameMatch ? contractNameMatch[1] : "Contract";

    // Parse state variables
    const stateVarRegex = /^\s*(\w+):\s*(\w+(?:<[^>]+>)?)/gm;
    let match;
    while ((match = stateVarRegex.exec(code)) !== null) {
      // Skip if it's inside a function
      if (!this.isInsideFunction(code, match.index)) {
        stateVariables.push({
          name: match[1],
          type: match[2],
        });
      }
    }

    // Parse receive methods
    const receiveRegex = /receive\s*\(\s*(?:"([^"]+)"|msg:\s*(\w+))\s*\)\s*{/g;
    while ((match = receiveRegex.exec(code)) !== null) {
      const msgOrOp = match[1] || match[2];
      methods.push({
        name: msgOrOp,
        type: "receive",
        params: match[2] ? [{ name: "msg", type: match[2] }] : [],
        isPayable: true,
      });
    }

    // Parse get methods
    const getMethodRegex =
      /get\s+fun\s+(\w+)\s*\(([^)]*)\)\s*:\s*(\w+(?:<[^>]+>)?)/g;
    while ((match = getMethodRegex.exec(code)) !== null) {
      const params = this.parseParams(match[2]);
      methods.push({
        name: match[1],
        type: "get",
        params,
        returnType: match[3],
      });
    }

    // Parse init method
    const initRegex = /init\s*\(([^)]*)\)/;
    match = initRegex.exec(code);
    if (match) {
      const params = this.parseParams(match[1]);
      methods.push({
        name: "init",
        type: "init",
        params,
      });
    }

    return {
      name: contractName,
      language: "tact",
      methods,
      stateVariables,
    };
  }

  /**
   * Parse FunC contract
   */
  private static parseFuncContract(code: string): ParsedContract {
    const methods: ContractMethod[] = [];
    const stateVariables: StateVariable[] = [];

    // Extract contract name from comments or default
    const nameMatch = code.match(/;;?\s*(\w+)\s+Contract/i);
    const contractName = nameMatch ? nameMatch[1] : "Contract";

    // Parse global variables (state)
    const globalRegex = /global\s+(\w+)\s+(\w+)/g;
    let match;
    while ((match = globalRegex.exec(code)) !== null) {
      stateVariables.push({
        name: match[2],
        type: match[1],
      });
    }

    // Parse recv_internal (receive messages)
    const recvInternalMatch = code.match(/\(\)\s+recv_internal\s*\([^)]*\)/);
    if (recvInternalMatch) {
      methods.push({
        name: "recv_internal",
        type: "receive",
        params: [
          { name: "my_balance", type: "int" },
          { name: "msg_value", type: "int" },
          { name: "in_msg_full", type: "cell" },
          { name: "in_msg_body", type: "slice" },
        ],
        isPayable: true,
      });
    }

    // Parse recv_external
    const recvExternalMatch = code.match(/\(\)\s+recv_external\s*\([^)]*\)/);
    if (recvExternalMatch) {
      methods.push({
        name: "recv_external",
        type: "receive",
        params: [{ name: "in_msg", type: "slice" }],
        isPayable: false,
      });
    }

    // Parse get methods
    const getMethodRegex = /(\w+)\s+(\w+)\s*\([^)]*\)\s+method_id/g;
    while ((match = getMethodRegex.exec(code)) !== null) {
      methods.push({
        name: match[2],
        type: "get",
        params: [],
        returnType: match[1],
      });
    }

    return {
      name: contractName,
      language: "func",
      methods,
      stateVariables,
    };
  }

  /**
   * Parse Tolk contract
   */
  private static parseTolkContract(code: string): ParsedContract {
    const methods: ContractMethod[] = [];
    const stateVariables: StateVariable[] = [];

    // Extract contract name from comments or default
    const nameMatch = code.match(/\/\/\s*(\w+)\s+Contract/i);
    const contractName = nameMatch ? nameMatch[1] : "Contract";

    // Parse global variables
    const globalRegex = /global\s+(\w+)\s+(\w+)/g;
    let match;
    while ((match = globalRegex.exec(code)) !== null) {
      stateVariables.push({
        name: match[2],
        type: match[1],
      });
    }

    // Parse recv_internal
    const recvInternalMatch = code.match(/fun\s+recv_internal\s*\([^)]*\)/);
    if (recvInternalMatch) {
      methods.push({
        name: "recv_internal",
        type: "receive",
        params: [
          { name: "my_balance", type: "int" },
          { name: "msg_value", type: "int" },
          { name: "in_msg_full", type: "cell" },
          { name: "in_msg_body", type: "slice" },
        ],
        isPayable: true,
      });
    }

    // Parse get methods
    const getMethodRegex = /(\w+)\s+(\w+)\s*\([^)]*\)\s+method_id/g;
    while ((match = getMethodRegex.exec(code)) !== null) {
      methods.push({
        name: match[2],
        type: "get",
        params: [],
        returnType: match[1],
      });
    }

    return {
      name: contractName,
      language: "tolk",
      methods,
      stateVariables,
    };
  }

  /**
   * Parse function parameters
   */
  private static parseParams(paramsStr: string): MethodParam[] {
    if (!paramsStr || paramsStr.trim() === "") {
      return [];
    }

    const params: MethodParam[] = [];
    const paramPairs = paramsStr.split(",").map((p) => p.trim());

    for (const pair of paramPairs) {
      // Handle "name: Type" format (Tact)
      const tactMatch = pair.match(/(\w+)\s*:\s*(\w+(?:<[^>]+>)?)/);
      if (tactMatch) {
        params.push({
          name: tactMatch[1],
          type: tactMatch[2],
        });
        continue;
      }

      // Handle "Type name" format (FunC/Tolk)
      const funcMatch = pair.match(/(\w+)\s+(\w+)/);
      if (funcMatch) {
        params.push({
          name: funcMatch[2],
          type: funcMatch[1],
        });
        continue;
      }

      // Fallback: just type
      if (pair) {
        params.push({
          name: "param",
          type: pair,
        });
      }
    }

    return params;
  }

  /**
   * Check if position is inside a function
   */
  private static isInsideFunction(code: string, position: number): boolean {
    const before = code.substring(0, position);
    const openBraces = (before.match(/{/g) || []).length;
    const closeBraces = (before.match(/}/g) || []).length;
    return openBraces > closeBraces;
  }

  /**
   * Infer opcode from message name
   */
  static inferOpcode(messageName: string): number | undefined {
    const opcodeMap: Record<string, number> = {
      increment: 1,
      decrement: 2,
      mint: 21,
      burn: 22,
      transfer: 0x5fcc3d14,
      stake: 1,
      unstake: 2,
      claim: 3,
      addLiquidity: 1,
      removeLiquidity: 2,
      swap: 3,
    };

    return opcodeMap[messageName];
  }
}
