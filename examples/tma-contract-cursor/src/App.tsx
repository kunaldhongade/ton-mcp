import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Address, toNano, fromNano } from '@ton/core';
import './App.css';

function App() {
  const [telegramId, setTelegramId] = useState<string>('');
  const [counter, setCounter] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // Initialize Telegram Web App
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();

      // Get user data from Telegram
      if (webApp.initDataUnsafe?.user?.id) {
        setTelegramId(webApp.initDataUnsafe.user.id.toString());
      }
    }
  }, []);

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
      // This would interact with the Counter contract
      // Implementation would depend on your contract deployment
      console.log('Incrementing counter...');
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
      // This would interact with the TMAProfile contract
      console.log('Registering profile for Telegram ID:', telegramId);
    } catch (error) {
      console.error('Failed to register profile:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>TON Telegram Mini App</h1>
        <p>Demo with Smart Contracts</p>

        <div className="telegram-info">
          {telegramId ? (
            <p>Telegram User ID: {telegramId}</p>
          ) : (
            <p>Not running in Telegram Web App</p>
          )}
        </div>

        <div className="wallet-section">
          {wallet ? (
            <div>
              <p>Connected: {wallet.account.address}</p>
              <button onClick={() => tonConnectUI.disconnect()}>
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-button">
              Connect TON Wallet
            </button>
          )}
        </div>

        {wallet && (
          <div className="contract-interactions">
            <div className="counter-section">
              <h2>Counter Contract</h2>
              <p>Current Value: {counter}</p>
              <button onClick={incrementCounter}>Increment Counter</button>
            </div>

            <div className="profile-section">
              <h2>User Profile Contract</h2>
              {userProfile ? (
                <div>
                  <p>Username: {userProfile.username}</p>
                  <p>Points: {userProfile.points}</p>
                  <p>Last Activity: {new Date(userProfile.lastActivity * 1000).toLocaleString()}</p>
                </div>
              ) : (
                <div>
                  <p>No profile found</p>
                  <button onClick={registerProfile}>Register Profile</button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
