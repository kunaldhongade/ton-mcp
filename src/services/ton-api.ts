import axios from 'axios';
import { config } from '../config.js';

export interface TonAccountInfo {
  balance: string;
  last_transaction_lt?: string;
  last_transaction_hash?: string;
  state: 'active' | 'uninitialized' | 'frozen';
  code?: string;
  data?: string;
}

export interface TonTransaction {
  hash: string;
  lt: string;
  account: string;
  success: boolean;
  utime: number;
  orig_status: string;
  end_status: string;
  total_fees: string;
  transaction_type: string;
  state_update: any;
  description: any;
  in_msg?: any;
  out_msgs?: any[];
}

export interface JettonInfo {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  adminAddress?: string;
  mintable: boolean;
}

export class TonApiService {
  private tonCenterClient;
  private tonApiClient;

  constructor() {
    this.tonCenterClient = axios.create({
      baseURL: config.ton.apiEndpoint || 'https://toncenter.com/api/v2/jsonRPC',
      timeout: 10000,
    });

    this.tonApiClient = axios.create({
      baseURL: 'https://tonapi.io/v1',
      timeout: 10000,
      headers: config.ton.apiKey ? { 'Authorization': `Bearer ${config.ton.apiKey}` } : {}
    });
  }

  /**
   * Get account information
   */
  async getAccountInfo(address: string): Promise<TonAccountInfo | null> {
    try {
      // Validate address format first
      if (!this.validateAddress(address)) {
        throw new Error(
          `❌ Invalid TON address format: ${address}\n\n` +
          `Troubleshooting:\n` +
          `✅ TON addresses should be in EQ... or UQ... format\n` +
          `✅ Example: EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr\n` +
          `✅ Use validate_address() to check format before querying\n\n` +
          `Common issues:\n` +
          `- Missing prefix (EQ or UQ)\n` +
          `- Invalid characters\n` +
          `- Incomplete address (should be 48 chars)`
        );
      }
      
      const response = await this.tonCenterClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getAddressInformation',
        params: { address }
      });

      if (response.data?.result) {
        const result = response.data.result;
        
        // Check if account exists
        if (result.state === 'uninitialized' || result.balance === '0') {
          throw new Error(
            `⚠️ Account not found or uninitialized: ${address}\n\n` +
            `This usually means:\n` +
            `✅ Address format is correct\n` +
            `❌ Account hasn't received any TON yet\n` +
            `❌ Account hasn't been initialized\n` +
            `❌ Wrong network (try mainnet if on testnet, or vice versa)\n\n` +
            `Next steps:\n` +
            `1. Verify you're on the correct network (mainnet/testnet)\n` +
            `2. Check if account has been funded\n` +
            `3. For new accounts, send some TON to initialize`
          );
        }
        
        return {
          balance: result.balance,
          last_transaction_lt: result.last_transaction_lt,
          last_transaction_hash: result.last_transaction_hash,
          state: this.mapAccountState(result.state),
          code: result.code,
          data: result.data
        };
      }
      
      throw new Error(
        `❌ Failed to get account info for: ${address}\n\n` +
        `Possible issues:\n` +
        `- API rate limit exceeded\n` +
        `- Network connectivity issues\n` +
        `- TON node temporarily unavailable\n\n` +
        `Try:\n` +
        `1. Wait a moment and try again\n` +
        `2. Check your internet connection\n` +
        `3. Try a different network (mainnet/testnet)`
      );
    } catch (error: any) {
      // Re-throw our custom errors
      if (error.message.includes('❌') || error.message.includes('⚠️')) {
        throw error;
      }
      
      // Generic error
      throw new Error(
        `❌ Error querying account: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Verify address format: validate_address("${address}")\n` +
        `2. Check network status: get_network_stats()\n` +
        `3. Ensure API keys are configured correctly`
      );
    }
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(address: string, limit: number = 10): Promise<TonTransaction[]> {
    try {
      const response = await this.tonCenterClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransactions',
        params: {
          address,
          limit,
          lt: undefined,
          hash: undefined,
          archival: false
        }
      });

      if (response.data?.result) {
        return response.data.result.map(this.mapTransaction);
      }
      return [];
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Get network status and configuration
   */
  async getNetworkStatus(): Promise<any> {
    try {
      const response = await this.tonCenterClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getMasterchainInfo'
      });

      return response.data?.result || null;
    } catch (error) {
      console.error('Failed to get network status:', error);
      return null;
    }
  }

  /**
   * Estimate transaction fees
   */
  async estimateFees(
    fromAddress: string,
    toAddress: string,
    amount: string,
    payload?: string
  ): Promise<any> {
    try {
      // This is a simplified estimation - in production you'd use more sophisticated methods
      const baseFee = '10000000'; // 0.01 TON in nanotons
      const gasFee = '5000000';  // Estimated gas

      return {
        baseFee,
        gasFee,
        totalFee: (BigInt(baseFee) + BigInt(gasFee)).toString(),
        estimatedAmount: amount
      };
    } catch (error) {
      console.error('Failed to estimate fees:', error);
      return null;
    }
  }

  /**
   * Get Jetton information
   */
  async getJettonInfo(jettonAddress: string): Promise<JettonInfo | null> {
    try {
      // Try to get jetton data from the contract
      const response = await this.tonCenterClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'runGetMethod',
        params: {
          address: jettonAddress,
          method: 'get_jetton_data',
          stack: []
        }
      });

      if (response.data?.result) {
        const stack = response.data.result.stack;
        // Parse jetton data from TVM stack
        return {
          address: jettonAddress,
          totalSupply: stack[0]?.[1], // total_supply
          mintable: stack[1]?.[1] === '1', // mintable
          adminAddress: stack[2]?.[1], // admin_address
          name: stack[3]?.[1], // jetton_content name
          symbol: stack[4]?.[1], // jetton_content symbol
          decimals: 9 // Standard for TON jettons
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get jetton info:', error);
      return null;
    }
  }

  /**
   * Get NFT collection information
   */
  async getNFTCollectionInfo(collectionAddress: string): Promise<any> {
    try {
      const response = await this.tonCenterClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'runGetMethod',
        params: {
          address: collectionAddress,
          method: 'get_collection_data',
          stack: []
        }
      });

      if (response.data?.result) {
        const stack = response.data.result.stack;
        return {
          nextItemIndex: stack[0]?.[1],
          collectionContent: stack[1]?.[1],
          ownerAddress: stack[2]?.[1]
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get NFT collection info:', error);
      return null;
    }
  }

  /**
   * Validate TON address
   */
  validateAddress(address: string): boolean {
    // Basic TON address validation
    const tonAddressRegex = /^[0-9a-fA-F]{64}$|^[0-9a-fA-F]{48}$|^[A-Za-z0-9_-]{48}$/;
    return tonAddressRegex.test(address.replace('0:', '').replace(':', ''));
  }

  /**
   * Get current gas prices
   */
  async getGasPrices(): Promise<any> {
    try {
      // This would typically come from the network
      return {
        slow: '1000000',    // 0.001 TON
        standard: '2000000', // 0.002 TON
        fast: '5000000'     // 0.005 TON
      };
    } catch (error) {
      console.error('Failed to get gas prices:', error);
      return null;
    }
  }

  /**
   * Convert between different units
   */
  convertUnits(amount: string, from: 'ton' | 'nanoton', to: 'ton' | 'nanoton'): string {
    const nanotonInTon = BigInt('1000000000');

    if (from === to) return amount;

    const amountBigInt = BigInt(amount);

    if (from === 'ton' && to === 'nanoton') {
      return (amountBigInt * nanotonInTon).toString();
    } else if (from === 'nanoton' && to === 'ton') {
      return (amountBigInt / nanotonInTon).toString();
    }

    return amount;
  }

  private mapAccountState(state: string): 'active' | 'uninitialized' | 'frozen' {
    switch (state) {
      case 'active': return 'active';
      case 'uninit': return 'uninitialized';
      case 'frozen': return 'frozen';
      default: return 'uninitialized';
    }
  }

  private mapTransaction(tx: any): TonTransaction {
    return {
      hash: tx?.transaction_id?.hash || tx?.hash || '',
      lt: tx?.transaction_id?.lt || tx?.lt || '0',
      account: tx?.address?.account_address || tx?.account || '',
      success: tx?.success ?? false,
      utime: tx?.utime || 0,
      orig_status: tx?.orig_status || 'unknown',
      end_status: tx?.end_status || 'unknown',
      total_fees: tx?.total_fees || '0',
      transaction_type: tx?.transaction_type || 'regular',
      state_update: tx?.state_update || {},
      description: tx?.description || 'No description',
      in_msg: tx?.in_msg || null,
      out_msgs: tx?.out_msgs || []
    };
  }
}

// Singleton instance
export const tonApiService = new TonApiService();

