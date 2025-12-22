# How to Add TON Connect to Your dApp

TON Connect provides a standard protocol for TON wallet connections, enabling secure communication between wallets and applications.

## For Web Applications

1. **Install TON Connect UI:**
```bash
npm install @tonconnect/ui
```

2. **Initialize TON Connect:**
```typescript
import { TonConnectUI } from '@tonconnect/ui';

const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://your-app.com/tonconnect-manifest.json',
  buttonRootId: 'ton-connect'
});
```

3. **Add to your HTML:**
```html
<div id="ton-connect"></div>
```

4. **Handle Connection:**
```typescript
// Check if wallet is connected
if (tonConnectUI.connected) {
  const account = tonConnectUI.account;
  console.log('Connected account:', account.address);
}

// Listen to connection events
tonConnectUI.onStatusChange((wallet) => {
  if (wallet) {
    console.log('Wallet connected:', wallet);
  } else {
    console.log('Wallet disconnected');
  }
});
```

## For Telegram Mini Apps (TMA)

1. **Install TON Connect for TMA:**
```bash
npm install @tonconnect/ui @tonconnect/sdk
```

2. **Initialize with TMA-specific config:**
```typescript
const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://your-tma.com/tonconnect-manifest.json',
  uiOptions: {
    language: 'en',
    uiPreferences: {
      theme: 'SYSTEM',
      borderRadius: 'm'
    }
  }
});

// TMA-specific: Handle back button
Telegram.WebApp.BackButton.onClick(() => {
  tonConnectUI.disconnect();
});
```

3. **Integrate with Telegram Web Apps API:**
```typescript
// Get user data from Telegram
const user = Telegram.WebApp.initDataUnsafe.user;

// Auto-connect if user has TON wallet
tonConnectUI.onStatusChange((wallet) => {
  if (wallet && user) {
    // Send user data to your backend for verification
    fetch('/api/verify-user', {
      method: 'POST',
      body: JSON.stringify({
        telegramUser: user,
        tonAddress: wallet.account.address
      })
    });
  }
});
```

## TON Connect Manifest

Create `tonconnect-manifest.json` in your public directory:

```json
{
  "url": "https://your-app.com",
  "name": "Your dApp Name",
  "iconUrl": "https://your-app.com/icon.png",
  "description": "Your dApp description",
  "aboutUrl": "https://your-app.com/about"
}
```

## Sending Transactions

```typescript
// Send a transaction
const transaction = {
  validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
  messages: [{
    address: "recipient_address",
    amount: "1000000000" // 1 TON in nanotons
  }]
};

try {
  const result = await tonConnectUI.sendTransaction(transaction);
  console.log('Transaction sent:', result);
} catch (error) {
  console.error('Transaction failed:', error);
}
```

## Best Practices

1. **Always check connection status** before sending transactions
2. **Handle disconnection gracefully** - users may switch wallets
3. **Provide clear feedback** during transaction signing
4. **Test with multiple wallets** (Tonkeeper, Tonhub, MyTonWallet, etc.)
5. **Handle network switching** appropriately
6. **For TMA**: Integrate with Telegram's back button and theme

## Common Issues

- **Manifest not loading**: Ensure manifest URL is accessible and valid JSON
- **Connection failing**: Check if wallet supports TON Connect protocol
- **Transaction rejected**: User cancelled or insufficient balance
- **TMA-specific**: Ensure proper Telegram Web Apps initialization

See also: `how_to_integrate_ton_connect_in_tma.md` for TMA-specific integration.
