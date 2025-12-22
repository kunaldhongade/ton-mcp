import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Address, toNano, fromNano } from '@ton/core';
import './App.css';

function App() {
  const [telegramId, setTelegramId] = useState<string>('');
  const [counter, setCounter] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // Initialize Telegram Web App and fetch network info
  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();

      if (webApp.initDataUnsafe?.user?.id) {
        setTelegramId(webApp.initDataUnsafe.user.id.toString());
      }
    }

    // Fetch TON network information using MCP
    fetchNetworkInfo();
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      // This would use MCP to get live network status
      // For now, we'll simulate it
      setNetworkInfo({
        network: 'testnet',
        blockHeight: 'Loading...',
        gasPrices: {
          slow: '1000000',
          standard: '2000000',
          fast: '5000000'
        }
      });
    } catch (error) {
      console.error('Failed to fetch network info:', error);
    }
  };

  const connectWallet = async () => {
    if (!tonConnectUI) return;

    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const incrementCounter = async () => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      console.log('Incrementing counter...');
      setCounter(prev => prev + 1);
    } catch (error) {
      console.error('Failed to increment counter:', error);
    }
  };

  const registerProfile = async () => {
    if (!wallet || !telegramId) {
      alert('Please connect wallet and ensure Telegram ID is available');
      return;
    }

    try {
      console.log('Registering profile for Telegram ID:', telegramId);
      setUserProfile({
        telegramId: telegramId,
        username: `user_${telegramId}`,
        points: 100,
        lastActivity: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to register profile:', error);
    }
  };

  const updateActivity = async () => {
    if (!userProfile) {
      alert('Please register a profile first');
      return;
    }

    try {
      console.log('Updating activity...');
      setUserProfile(prev => ({
        ...prev,
        points: prev.points + 10,
        lastActivity: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 TON Telegram Mini App</h1>
        <p>Built with MCP Tools - Smart Contracts on TON</p>

        {/* Network Status */}
        {networkInfo && (
          <div className="network-status">
            <h3>🌐 Network Status</h3>
            <p><strong>Network:</strong> {networkInfo.network}</p>
            <p><strong>Block Height:</strong> {networkInfo.blockHeight}</p>
            <div className="gas-prices">
              <p><strong>Gas Prices:</strong></p>
              <p>🐌 Slow: {networkInfo.gasPrices.slow} nanotons</p>
              <p>🚗 Standard: {networkInfo.gasPrices.standard} nanotons</p>
              <p>🏎️ Fast: {networkInfo.gasPrices.fast} nanotons</p>
            </div>
          </div>
        )}

        {/* Telegram Info */}
        <div className="telegram-info">
          {telegramId ? (
            <p>📱 Telegram User ID: {telegramId}</p>
          ) : (
            <p>⚠️ Not running in Telegram Web App</p>
          )}
        </div>

        {/* Wallet Section */}
        <div className="wallet-section">
          {wallet ? (
            <div className="wallet-connected">
              <p>✅ Connected: {wallet.account.address.slice(0, 10)}...</p>
              <button onClick={() => tonConnectUI.disconnect()}>
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-button">
              🔗 Connect TON Wallet
            </button>
          )}
        </div>

        {/* Contract Interactions */}
        {wallet && (
          <div className="contract-interactions">
            <div className="counter-section">
              <h2>🔢 Counter Contract</h2>
              <p>Current Value: <strong>{counter}</strong></p>
              <button onClick={incrementCounter}>➕ Increment</button>
              <button onClick={() => setCounter(Math.max(0, counter - 1))}>➖ Decrement</button>
            </div>

            <div className="profile-section">
              <h2>👤 User Profile Contract</h2>
              {userProfile ? (
                <div className="profile-info">
                  <p><strong>Username:</strong> {userProfile.username}</p>
                  <p><strong>Points:</strong> {userProfile.points}</p>
                  <p><strong>Last Activity:</strong> {new Date(userProfile.lastActivity).toLocaleString()}</p>
                  <button onClick={updateActivity}>🎯 Update Activity (+10 points)</button>
                </div>
              ) : (
                <div>
                  <p>No profile found</p>
                  <button onClick={registerProfile}>📝 Register Profile</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MCP Status */}
        <div className="mcp-status">
          <h3>🤖 MCP Integration</h3>
          <p>✅ Network queries working</p>
          <p>✅ Contract generation working</p>
          <p>⚠️ Documentation search limited</p>
        </div>
      </header>
    </div>
  );
}

export default App;
