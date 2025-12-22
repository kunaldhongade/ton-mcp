# Building Frontends for TON dApps

This guide covers frontend development best practices for TON blockchain applications.

## Technology Stack

### Recommended Framework
- **React** with TypeScript for type safety
- **Next.js** for full-stack applications
- **Vite** for fast development builds

### TON-Specific Libraries
```bash
npm install @tonconnect/ui @ton/ton tonweb
```

## Basic dApp Structure

```typescript
// src/App.tsx
import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import WalletConnect from './components/WalletConnect';
import ContractInteraction from './components/ContractInteraction';

function App() {
  return (
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      <div className="app">
        <header>
          <h1>My TON dApp</h1>
          <WalletConnect />
        </header>
        <main>
          <ContractInteraction />
        </main>
      </div>
    </TonConnectUIProvider>
  );
}

export default App;
```

## Wallet Integration

### TON Connect Setup
```typescript
// components/WalletConnect.tsx
import { useTonConnectUI } from '@tonconnect/ui-react';

function WalletConnect() {
  const [tonConnectUI] = useTonConnectUI();

  const handleConnect = async () => {
    try {
      await tonConnectUI.connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (tonConnectUI.connected) {
    return (
      <div>
        Connected: {tonConnectUI.account?.address.slice(0, 10)}...
        <button onClick={() => tonConnectUI.disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleConnect}>
      Connect TON Wallet
    </button>
  );
}
```

## Contract Interaction

### Reading Contract Data
```typescript
// hooks/useContract.ts
import { useTonClient } from './useTonClient';

export function useContractData(contractAddress: string) {
  const client = useTonClient();

  const getData = async () => {
    if (!client) return null;

    try {
      const result = await client.callGetMethod(
        contractAddress,
        'get_data'
      );
      return result;
    } catch (error) {
      console.error('Failed to get contract data:', error);
      return null;
    }
  };

  return { getData };
}
```

### Sending Transactions
```typescript
// utils/transactions.ts
import { TonConnectUI } from '@tonconnect/ui';

export async function sendTransaction(
  tonConnectUI: TonConnectUI,
  messages: any[]
) {
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    messages
  };

  try {
    const result = await tonConnectUI.sendTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
```

## State Management

### React Context for Blockchain State
```typescript
// contexts/BlockchainContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface BlockchainContextType {
  balance: string | null;
  setBalance: (balance: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(
  undefined
);

export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <BlockchainContext.Provider
      value={{
        balance,
        setBalance,
        isLoading,
        setIsLoading
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
}
```

## Error Handling

### Global Error Boundary
```typescript
// components/ErrorBoundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('dApp error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page and try again</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## UI/UX Best Practices

### Loading States
```typescript
function ContractInteraction() {
  const { isLoading } = useBlockchain();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Processing transaction...</p>
      </div>
    );
  }

  return (
    <div className="contract-interaction">
      {/* Contract interaction UI */}
    </div>
  );
}
```

### Transaction Confirmations
```typescript
function TransactionButton() {
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const handleTransaction = async () => {
    setTxStatus('pending');
    try {
      await sendTransaction(tonConnectUI, messages);
      setTxStatus('success');
      // Show success message
    } catch (error) {
      setTxStatus('error');
      // Show error message
    }
  };

  return (
    <button
      onClick={handleTransaction}
      disabled={txStatus === 'pending'}
      className={`tx-button ${txStatus}`}
    >
      {txStatus === 'pending' ? 'Processing...' :
       txStatus === 'success' ? '✅ Success!' :
       txStatus === 'error' ? '❌ Failed - Try Again' :
       'Send Transaction'}
    </button>
  );
}
```

## Testing Frontend

### Unit Tests
```typescript
// __tests__/WalletConnect.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import WalletConnect from '../components/WalletConnect';

test('renders connect button when not connected', () => {
  render(<WalletConnect />);
  expect(screen.getByText('Connect TON Wallet')).toBeInTheDocument();
});

test('renders disconnect button when connected', () => {
  // Mock connected state
  render(<WalletConnect />);
  expect(screen.getByText('Disconnect')).toBeInTheDocument();
});
```

### Integration Tests
```typescript
// __tests__/ContractInteraction.test.tsx
import { render, waitFor } from '@testing-library/react';
import ContractInteraction from '../components/ContractInteraction';

test('loads contract data on mount', async () => {
  render(<ContractInteraction />);

  await waitFor(() => {
    expect(screen.getByText(/Counter: \d+/)).toBeInTheDocument();
  });
});
```

## Deployment

### Build Configuration
```javascript
// vite.config.js
export default {
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          ton: ['@tonconnect/ui', '@ton/ton'],
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
};
```

### Environment Variables
```bash
# .env
VITE_TON_NETWORK=testnet
VITE_CONTRACT_ADDRESS=your_contract_address
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
const ContractInteraction = lazy(() => import('./components/ContractInteraction'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContractInteraction />
    </Suspense>
  );
}
```

### Memoization
```typescript
// Memoize expensive calculations
const contractData = useMemo(() => {
  return expensiveContractCall();
}, [contractAddress, userAddress]);
```

This guide provides the foundation for building robust TON dApp frontends. Always refer to the official TON documentation and community resources for the latest best practices.
