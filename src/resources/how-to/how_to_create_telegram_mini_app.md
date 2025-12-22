# How to Create a Telegram Mini App (TMA) with TON Integration

Telegram Mini Apps are web applications that run inside Telegram, providing seamless integration with TON blockchain functionality.

## Step 1: Set Up Telegram Bot

1. **Create a Telegram Bot:**
   - Message @BotFather on Telegram
   - Send `/newbot` and follow instructions
   - Save your bot token

2. **Enable Web Apps:**
   - Send `/setmenubutton` to BotFather
   - Provide your Web App URL

## Step 2: Create TMA Project Structure

```bash
# Create project
mkdir my-ton-tma && cd my-ton-tma
npm init -y

# Install dependencies
npm install @tonconnect/ui @ton/ton react react-dom
npm install -D vite typescript
```

## Step 3: Basic TMA Structure

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My TON TMA</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**src/main.tsx:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

## Step 4: Integrate Telegram Web Apps API

**src/App.tsx:**
```typescript
import React, { useEffect, useState } from 'react';
import { TonConnectUI } from '@tonconnect/ui';

declare global {
  interface Window {
    Telegram: any;
  }
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [tonConnectUI, setTonConnectUI] = useState<TonConnectUI | null>(null);

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // Expand to full height
      tg.expand();

      // Set theme
      tg.setHeaderColor('#000000');

      // Get user data
      setUser(tg.initDataUnsafe?.user);

      // Handle back button
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        // Handle back navigation
        window.history.back();
      });

      // Initialize TON Connect
      const tonConnect = new TonConnectUI({
        manifestUrl: 'https://your-domain.com/tonconnect-manifest.json',
        uiOptions: {
          language: tg.initDataUnsafe?.language_code || 'en',
          uiPreferences: {
            theme: tg.colorScheme || 'dark',
            borderRadius: 'm'
          }
        }
      });

      setTonConnectUI(tonConnect);

      // Ready signal
      tg.ready();
    }
  }, []);

  const handleConnect = async () => {
    if (tonConnectUI) {
      await tonConnectUI.connectWallet();
    }
  };

  const handleSendTransaction = async () => {
    if (!tonConnectUI?.connected) return;

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr", // Example address
        amount: "100000000" // 0.1 TON
      }]
    };

    try {
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent:', result);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: window.Telegram?.WebApp?.colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
      color: window.Telegram?.WebApp?.colorScheme === 'dark' ? '#ffffff' : '#000000',
      minHeight: '100vh'
    }}>
      <h1>My TON Mini App</h1>

      {user && (
        <div>
          <h2>Welcome, {user.first_name}!</h2>
          <p>Username: @{user.username}</p>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        {!tonConnectUI?.connected ? (
          <button
            onClick={handleConnect}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0088cc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Connect TON Wallet
          </button>
        ) : (
          <div>
            <p>✅ Connected: {tonConnectUI.account?.address.slice(0, 10)}...</p>
            <button
              onClick={handleSendTransaction}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Send 0.1 TON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

## Step 5: Configure Build and Deployment

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Step 6: Deploy and Configure Bot

1. **Deploy your app** to a hosting service (Vercel, Netlify, etc.)

2. **Configure Bot:**
   - Send `/setmenubutton` to @BotFather
   - Provide your deployed URL
   - Users can now access your TMA from the bot menu

3. **Test the integration:**
   - Open your bot in Telegram
   - Click the menu button
   - Your TMA should load with TON integration

## TMA-Specific Best Practices

### Theme Integration
```typescript
// Use Telegram theme colors
const theme = window.Telegram.WebApp.colorScheme;
const backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
const textColor = theme === 'dark' ? '#ffffff' : '#000000';
```

### Viewport Handling
```typescript
// Handle dynamic viewport
window.Telegram.WebApp.onEvent('viewportChanged', () => {
  const viewportHeight = window.Telegram.WebApp.viewportHeight;
  // Adjust your layout accordingly
});
```

### Secure Data Handling
```typescript
// Validate initData for security
const initData = window.Telegram.WebApp.initData;
if (initData) {
  // Send to backend for validation
  fetch('/api/validate-init-data', {
    method: 'POST',
    body: initData
  });
}
```

### Error Handling
```typescript
// Handle TMA-specific errors
window.Telegram.WebApp.onEvent('error', (error) => {
  console.error('TMA Error:', error);
  // Show user-friendly error message
});
```

## Common TMA Issues

1. **Web App not loading**: Check if URL is HTTPS and accessible
2. **TON Connect failing**: Ensure manifest URL is correct and accessible
3. **Theme not applying**: Check Telegram client version
4. **Back button not working**: Ensure proper event listeners
5. **Viewport issues**: Handle dynamic viewport changes

## Advanced TMA Features

### Cloud Storage
```typescript
// Store user data in Telegram Cloud
window.Telegram.WebApp.CloudStorage.setItem('user_preference', 'dark_mode');

// Retrieve data
window.Telegram.WebApp.CloudStorage.getItem('user_preference', (value) => {
  console.log('User preference:', value);
});
```

### Haptic Feedback
```typescript
// Provide tactile feedback
window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
```

### Biometric Authentication
```typescript
// Request biometric auth
const result = await window.Telegram.WebApp.requestBiometricAuth();
if (result) {
  // Authentication successful
}
```

## Testing Your TMA

1. **Development testing**: Use Telegram's test environment
2. **Device testing**: Test on mobile and desktop
3. **Wallet testing**: Test with different TON wallets
4. **Network testing**: Test on mainnet and testnet

See also: `how_to_add_ton_connect.md` for wallet integration details.
