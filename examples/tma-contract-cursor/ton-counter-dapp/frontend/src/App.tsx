import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { Address, fromNano } from '@ton/core';
import { useTonClient } from './hooks/useTonClient';
import { Counter } from './contracts/Counter';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const wallet = useTonWallet();
  const { client } = useTonClient();
  const [counter, setCounter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');

  // Contract address - would be set after deployment
  const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';

  // Fetch balance
  useEffect(() => {
    if (!address || !client) return;
    
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const balance = await client.getBalance(Address.parse(address));
        setBalance(fromNano(balance));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address, client]);

  // Fetch counter value
  useEffect(() => {
    if (!address || !client || CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE') return;
    
    const fetchCounter = async () => {
      try {
        const contract = client.open(Counter.createFromAddress(Address.parse(CONTRACT_ADDRESS)));
        const value = await contract.getCounter();
        setCounter(value);
      } catch (err) {
        console.error('Failed to fetch counter:', err);
      }
    };
    
    fetchCounter();
    const interval = setInterval(fetchCounter, 5000);
    return () => clearInterval(interval);
  }, [address, client, CONTRACT_ADDRESS]);

  // Increment counter
  const handleIncrement = async () => {
    if (!address || !tonConnectUI || CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE') {
      setError('Please connect wallet and deploy contract first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const contract = client!.open(Counter.createFromAddress(Address.parse(CONTRACT_ADDRESS)));
      
      await contract.send(
        wallet!.account!,
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'Increment',
        }
      );
      
      // Wait a bit then refresh
      setTimeout(() => {
        const fetchCounter = async () => {
          const value = await contract.getCounter();
          setCounter(value);
        };
        fetchCounter();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  // Decrement counter
  const handleDecrement = async () => {
    if (!address || !tonConnectUI || CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE') {
      setError('Please connect wallet and deploy contract first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const contract = client!.open(Counter.createFromAddress(Address.parse(CONTRACT_ADDRESS)));
      
      await contract.send(
        wallet!.account!,
        {
          value: toNano('0.05'),
        },
        {
          $$type: 'Decrement',
        }
      );
      
      setTimeout(() => {
        const fetchCounter = async () => {
          const value = await contract.getCounter();
          setCounter(value);
        };
        fetchCounter();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            TON Counter dApp
          </h1>
          <p className="text-gray-600">Built with TON MCP assistance</p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Wallet</h2>
            <TonConnectButton />
          </div>

          {address && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-mono text-sm break-all">{address}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : `${balance} TON`}
                </p>
              </div>
            </div>
          )}

          {!address && (
            <p className="text-gray-500 text-center py-8">
              Connect your wallet to get started
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Counter Contract</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-2">Current Counter Value</p>
            <p className="text-5xl font-bold text-blue-600">
              {counter !== null ? counter : '--'}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleDecrement}
              disabled={!address || loading || CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE'}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : 'Decrement'}
            </button>
            
            <button
              onClick={handleIncrement}
              disabled={!address || loading || CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : 'Increment'}
            </button>
          </div>

          {CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
              ⚠️ Please deploy the contract and update CONTRACT_ADDRESS in App.tsx
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

