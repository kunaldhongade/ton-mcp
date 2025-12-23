/**
 * Comprehensive error handling utility for TON MCP
 * Provides context-aware error messages and troubleshooting steps
 */

export interface ErrorContext {
  operation: string;
  details?: any;
  suggestions?: string[];
}

export class MCPError extends Error {
  constructor(
    message: string,
    public context: ErrorContext,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class ErrorHandler {
  /**
   * Format error with context and suggestions
   */
  static formatError(
    error: any,
    operation: string,
    suggestions: string[] = []
  ): string {
    const emoji = this.getErrorEmoji(error);
    const errorMessage = error.message || String(error);
    
    let formatted = `${emoji} **Error in ${operation}**\n\n`;
    formatted += `**Message:** ${errorMessage}\n\n`;
    
    if (suggestions.length > 0) {
      formatted += `**💡 Troubleshooting:**\n`;
      suggestions.forEach((suggestion, index) => {
        formatted += `${index + 1}. ${suggestion}\n`;
      });
      formatted += '\n';
    }
    
    // Add common troubleshooting steps
    formatted += this.getCommonTroubleshooting(error, operation);
    
    return formatted;
  }

  /**
   * Get appropriate emoji for error type
   */
  private static getErrorEmoji(error: any): string {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return '🔌';
    }
    if (error.response?.status === 429) {
      return '⏱️';
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return '🔒';
    }
    if (error.response?.status === 404) {
      return '🔍';
    }
    if (error.response?.status >= 500) {
      return '🚨';
    }
    return '❌';
  }

  /**
   * Get common troubleshooting steps based on error type
   */
  private static getCommonTroubleshooting(error: any, operation: string): string {
    let troubleshooting = '**🛠️  Common Solutions:**\n';
    
    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      troubleshooting += '• Check your internet connection\n';
      troubleshooting += '• Verify TON network is accessible\n';
      troubleshooting += '• Try again in a few moments\n';
    }
    
    // Rate limiting
    else if (error.response?.status === 429) {
      troubleshooting += '• API rate limit exceeded - wait a moment\n';
      troubleshooting += '• Consider setting up an API key for higher limits\n';
      troubleshooting += '• Reduce frequency of requests\n';
    }
    
    // Authentication
    else if (error.response?.status === 401 || error.response?.status === 403) {
      troubleshooting += '• Check your API key configuration\n';
      troubleshooting += '• Verify API key has required permissions\n';
      troubleshooting += '• Ensure API key is not expired\n';
    }
    
    // Not found
    else if (error.response?.status === 404) {
      troubleshooting += '• Verify the resource exists\n';
      troubleshooting += '• Check for typos in addresses or IDs\n';
      troubleshooting += '• Ensure you\'re on the correct network (mainnet/testnet)\n';
    }
    
    // Server errors
    else if (error.response?.status >= 500) {
      troubleshooting += '• TON API is temporarily unavailable\n';
      troubleshooting += '• Wait a few minutes and retry\n';
      troubleshooting += '• Check TON network status\n';
    }
    
    // Generic errors
    else {
      troubleshooting += '• Verify all parameters are correct\n';
      troubleshooting += '• Check error message for specific details\n';
      troubleshooting += '• Try the operation again\n';
    }
    
    // Operation-specific troubleshooting
    troubleshooting += `\n**📖 Operation-specific:**\n`;
    troubleshooting += this.getOperationSpecificHelp(operation);
    
    return troubleshooting;
  }

  /**
   * Get operation-specific help
   */
  private static getOperationSpecificHelp(operation: string): string {
    const helpMap: Record<string, string> = {
      'contract generation': 
        '• Use `list_ton_resources` to see available templates\n' +
        '• Check contract type spelling (counter, wallet, jetton, etc.)\n' +
        '• Try a different language (tact, func, tolk)',
      
      'documentation search':
        '• Try broader search terms\n' +
        '• Use `list_ton_resources` for available guides\n' +
        '• Check category parameter (smart-contracts, frontend, tma)',
      
      'account info':
        '• Validate address format: EQxxx or UQxxx\n' +
        '• Verify network (testnet vs mainnet)\n' +
        '• Ensure account is initialized',
      
      'transaction history':
        '• Confirm account has transactions\n' +
        '• Try reducing limit parameter\n' +
        '• Verify address is correct',
      
      'deployment':
        '• Check wallet has sufficient TON (min 0.1)\n' +
        '• Verify MNEMONIC environment variable\n' +
        '• Test on testnet first',
      
      'compilation':
        '• Ensure compiler is installed (tolk/func)\n' +
        '• Check syntax errors in contract code\n' +
        '• Verify contract language matches compiler',
      
      'frontend generation':
        '• Specify required features array\n' +
        '• Check framework parameter (react, vanilla)\n' +
        '• Review generated code for completeness',
      
      'project creation':
        '• Follow official tool installation steps\n' +
        '• Ensure Node.js and npm are updated\n' +
        '• Use recommended project type'
    };
    
    // Find matching operation
    for (const [key, help] of Object.entries(helpMap)) {
      if (operation.toLowerCase().includes(key)) {
        return help;
      }
    }
    
    return '• Review tool documentation: `ton-mcp --help`\n' +
           '• Check AI_USAGE_GUIDE.md for examples\n' +
           '• Contact support if issue persists';
  }

  /**
   * Wrap async operation with error handling
   */
  static async wrapOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      throw new MCPError(
        this.formatError(error, context.operation, context.suggestions),
        context,
        error
      );
    }
  }

  /**
   * Create user-friendly error message for specific scenarios
   */
  static createScenarioError(scenario: string, details: any = {}): string {
    const scenarios: Record<string, (d: any) => string> = {
      'invalid_address': (d) => 
        `❌ **Invalid TON Address**\n\n` +
        `Address: \`${d.address}\`\n\n` +
        `**Required format:**\n` +
        `• Starts with EQ or UQ\n` +
        `• 48 characters long\n` +
        `• Base64 encoded\n\n` +
        `**Example:** EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr\n\n` +
        `**Common mistakes:**\n` +
        `• Missing prefix (EQ/UQ)\n` +
        `• Wrong length\n` +
        `• Special characters\n` +
        `• Spaces in address`,

      'compiler_not_found': (d) =>
        `🔧 **Compiler Not Installed**\n\n` +
        `Language: ${d.language}\n\n` +
        `**Installation:**\n` +
        d.language === 'tolk' ?
          `• Download from: https://github.com/ton-blockchain/tolk\n` +
          `• Add to PATH\n` +
          `• Verify: \`tolk --version\`\n\n` +
          `**Alternative:** Use Tact or FunC instead` :
          `• Install TON development tools\n` +
          `• Use Blueprint: \`npm create ton@latest\`\n` +
          `• Or try a different language`,

      'insufficient_balance': (d) =>
        `💰 **Insufficient Balance**\n\n` +
        `Current: ${d.current} TON\n` +
        `Required: ${d.required} TON\n` +
        `Needed: ${d.needed} TON more\n\n` +
        `**Solutions:**\n` +
        `• Add more TON to wallet\n` +
        `• Try with lower value\n` +
        `• Use testnet for testing (free)`,

      'network_mismatch': (d) =>
        `🌐 **Network Mismatch**\n\n` +
        `Current network: ${d.current}\n` +
        `Expected: ${d.expected}\n\n` +
        `**Fix:**\n` +
        `• Switch to correct network in config\n` +
        `• Or try same operation on ${d.expected}\n` +
        `• Verify contract is deployed on current network`,

      'no_results_found': (d) =>
        `🔍 **No Results Found**\n\n` +
        `Query: "${d.query}"\n` +
        `Category: ${d.category || 'all'}\n\n` +
        `**Try:**\n` +
        `• Broader search terms\n` +
        `• Different category\n` +
        `• Use \`list_ton_resources\` for available content\n` +
        `• Check spelling`,

      'rate_limit_exceeded': (d) =>
        `⏱️  **Rate Limit Exceeded**\n\n` +
        `Requests: ${d.count} in ${d.period}\n` +
        `Limit: ${d.limit} per ${d.period}\n\n` +
        `**Solutions:**\n` +
        `• Wait ${d.waitTime} seconds\n` +
        `• Get API key for higher limits\n` +
        `• Reduce request frequency\n` +
        `• Batch operations when possible`
    };

    const formatter = scenarios[scenario];
    return formatter ? formatter(details) : 
      `❌ **Error:** ${scenario}\n\nDetails: ${JSON.stringify(details, null, 2)}`;
  }
}

/**
 * Validation utilities with helpful error messages
 */
export class Validator {
  static validateAddress(address: string): { valid: boolean; error?: string } {
    if (!address || typeof address !== 'string') {
      return {
        valid: false,
        error: ErrorHandler.createScenarioError('invalid_address', { address })
      };
    }

    if (!address.match(/^(EQ|UQ)[A-Za-z0-9_-]{46}$/)) {
      return {
        valid: false,
        error: ErrorHandler.createScenarioError('invalid_address', { address })
      };
    }

    return { valid: true };
  }

  static validateNetwork(network: string): { valid: boolean; error?: string } {
    const validNetworks = ['mainnet', 'testnet'];
    
    if (!validNetworks.includes(network)) {
      return {
        valid: false,
        error: `❌ Invalid network: "${network}"\n\n` +
               `Valid networks: ${validNetworks.join(', ')}\n\n` +
               `Default: testnet (recommended for testing)`
      };
    }

    return { valid: true };
  }

  static validateAmount(amount: string | number): { valid: boolean; error?: string } {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(num) || num <= 0) {
      return {
        valid: false,
        error: `❌ Invalid amount: "${amount}"\n\n` +
               `• Must be a positive number\n` +
               `• Example: 0.1 (for 0.1 TON)\n` +
               `• Minimum: 0.01 TON`
      };
    }

    return { valid: true };
  }
}

