# How to Work with TON API

TON provides several APIs for interacting with the blockchain programmatically. This guide covers the main APIs and best practices.

## TON Center API

### Overview
TON Center provides REST and JSON-RPC APIs for accessing TON blockchain data.

### Endpoints
- **Mainnet:** `https://toncenter.com/api/v2/jsonRPC`
- **Testnet:** `https://testnet.toncenter.com/api/v2/jsonRPC`

### Authentication
```typescript
// For higher rate limits, get an API key
const headers = {
  'X-API-Key': 'your_api_key_here'
};
```

### Common Queries

#### Get Account Balance
```typescript
const response = await fetch('https://toncenter.com/api/v2/jsonRPC', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getAddressInformation',
    params: {
      address: 'EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr'
    }
  })
});

const data = await response.json();
console.log('Balance:', data.result.balance);
```

#### Get Transactions
```typescript
const response = await fetch('https://toncenter.com/api/v2/jsonRPC', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getTransactions',
    params: {
      address: 'EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr',
      limit: 10
    }
  })
});

const data = await response.json();
console.log('Transactions:', data.result);
```

#### Send Transaction
```typescript
// Note: Requires wallet integration
const transaction = {
  validUntil: Math.floor(Date.now() / 1000) + 600,
  messages: [{
    address: 'recipient_address',
    amount: '1000000000' // 1 TON
  }]
};

// Use wallet to sign and send
```

## TON API (tonapi.io)

### Overview
TON API provides enhanced blockchain data with additional features like NFT data, Jetton analytics, and more.

### Authentication
```typescript
const headers = {
  'Authorization': 'Bearer your_api_key'
};
```

### Features
- **Enhanced transaction data**
- **NFT collection information**
- **Jetton analytics**
- **Account events**
- **Rate limit information**

### Example Queries

#### Get NFT Items
```typescript
const response = await fetch(
  'https://tonapi.io/v1/nft/getItemsByCollection?collection=collection_address',
  {
    headers: {
      'Authorization': 'Bearer your_api_key'
    }
  }
);

const data = await response.json();
console.log('NFT Items:', data.nft_items);
```

#### Get Jetton Holders
```typescript
const response = await fetch(
  'https://tonapi.io/v1/jetton/holders?account=jetton_master_address',
  {
    headers: {
      'Authorization': 'Bearer your_api_key'
    }
  }
);

const data = await response.json();
console.log('Holders:', data.holders);
```

## Rate Limiting

### TON Center
- **Free tier:** 1 request/second, 10,000 requests/day
- **API Key:** 10 requests/second, 1,000,000 requests/day

### TON API
- **Free tier:** 1 request/second, 1,000 requests/day
- **Paid tiers:** Higher limits available

### Best Practices
```typescript
// Implement exponential backoff
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        // Rate limited, wait and retry
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## Error Handling

### Common HTTP Status Codes
- **200:** Success
- **400:** Bad Request (invalid parameters)
- **401:** Unauthorized (invalid API key)
- **429:** Too Many Requests (rate limited)
- **500:** Internal Server Error

### Error Response Format
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params"
  },
  "id": 1
}
```

## SDK Usage

### TonWeb (JavaScript)
```javascript
import TonWeb from 'tonweb';

const tonweb = new TonWeb();

async function getBalance(address) {
  const balance = await tonweb.getBalance(address);
  return tonweb.utils.fromNano(balance);
}
```

### TON Connect SDK
```typescript
import { TonConnect } from '@tonconnect/sdk';

const connector = new TonConnect();

// Connect wallet
await connector.connect({
  universalLink: 'https://app.tonkeeper.com/ton-connect',
  bridgeUrl: 'https://bridge.tonapi.io/bridge'
});
```

## Webhook Integration

### Setting Up Webhooks
```typescript
// For transaction monitoring
const webhookData = {
  url: 'https://your-app.com/webhook',
  event_types: ['transaction'],
  addresses: ['your_contract_address']
};

// Register webhook with TON API
await fetch('https://tonapi.io/v1/webhook', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(webhookData)
});
```

## Best Practices

### 1. Connection Management
```typescript
// Reuse connections
const client = axios.create({
  baseURL: 'https://toncenter.com/api/v2/jsonRPC',
  timeout: 10000,
});

// Connection pooling for high-throughput apps
```

### 2. Caching Strategy
```typescript
// Cache frequently accessed data
const cache = new Map();

async function getCachedBalance(address) {
  if (cache.has(address)) {
    return cache.get(address);
  }

  const balance = await getBalanceFromAPI(address);
  cache.set(address, balance);

  // Expire cache after 5 minutes
  setTimeout(() => cache.delete(address), 5 * 60 * 1000);

  return balance;
}
```

### 3. Batch Requests
```typescript
// Batch multiple requests to reduce API calls
const batchRequests = [
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'getAddressInformation',
    params: { address: 'address1' }
  },
  {
    jsonrpc: '2.0',
    id: 2,
    method: 'getAddressInformation',
    params: { address: 'address2' }
  }
];

const response = await fetch('https://toncenter.com/api/v2/jsonRPC', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(batchRequests)
});
```

### 4. Monitoring & Logging
```typescript
// Log API usage
const apiLogger = {
  logRequest: (method, params) => {
    console.log(`API Call: ${method}`, params);
  },
  logResponse: (method, response, duration) => {
    console.log(`API Response: ${method} - ${duration}ms`, response);
  },
  logError: (method, error) => {
    console.error(`API Error: ${method}`, error);
  }
};
```

## Production Considerations

### Load Balancing
```typescript
// Use multiple API endpoints
const endpoints = [
  'https://toncenter.com/api/v2/jsonRPC',
  'https://backup-toncenter.com/api/v2/jsonRPC'
];

async function resilientApiCall(method, params) {
  for (const endpoint of endpoints) {
    try {
      return await callAPI(endpoint, method, params);
    } catch (error) {
      console.warn(`Endpoint ${endpoint} failed:`, error);
    }
  }
  throw new Error('All endpoints failed');
}
```

### Health Monitoring
```typescript
// Monitor API health
async function checkAPIHealth(endpoint) {
  try {
    const start = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getMasterchainInfo'
      })
    });
    const duration = Date.now() - start;

    return {
      healthy: response.ok,
      responseTime: duration,
      status: response.status
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}
```

This guide covers the essential aspects of working with TON APIs. For production applications, consider implementing comprehensive error handling, monitoring, and failover strategies.

