# Creating Telegram Mini Apps with TON Integration

Telegram Mini Apps (TMA) are web applications that run inside Telegram, providing seamless blockchain integration. This guide covers building TMAs with TON functionality.

## TMA Fundamentals

### What are TMAs?
- Web apps running inside Telegram
- Access to Telegram Web Apps API
- Native Telegram UI/UX integration
- Secure user authentication
- Cross-platform compatibility

### TMA vs Regular Web Apps
- **Authentication**: Telegram handles user auth
- **UI**: Telegram provides native components
- **Distribution**: No app stores needed
- **Monetization**: Built-in payment systems
- **Security**: Telegram's security model

## Project Setup

### 1. Create Telegram Bot
```bash
# Message @BotFather on Telegram
/newbot
# Follow instructions to create your bot
# Save the bot token
```

### 2. Initialize TMA Project
```bash
# Create project
mkdir my-ton-tma && cd my-ton-tma
npm init -y

# Install dependencies
npm install @tonconnect/ui @ton/ton react react-dom
npm install -D vite typescript @types/node
```

### 3. Basic Project Structure
```
my-ton-tma/
├── public/
│   ├── tonconnect-manifest.json
│   └── index.html
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   └── TMAHeader.tsx
│   ├── hooks/
│   │   └── useTMA.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

## Telegram Web Apps Integration

### Initialize TMA
```typescript
// src/hooks/useTMA.ts
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram: any;
  }
}

export function useTMA() {
  const [user, setUser] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // Expand to full viewport
      tg.expand();
      setIsExpanded(true);

      // Get user data
      setUser(tg.initDataUnsafe?.user);

      // Set theme
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#ffffff');

      // Handle viewport changes
      tg.onEvent('viewportChanged', () => {
        console.log('Viewport changed:', tg.viewportHeight);
      });

      // Handle back button
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        // Handle navigation
        window.history.back();
      });

      // Signal ready
      tg.ready();

      // Cleanup
      return () => {
        tg.BackButton.hide();
      };
    }
  }, []);

  return { user, isExpanded, tg: window.Telegram?.WebApp };
}
```

### TMA-Specific Components
```typescript
// src/components/TMAHeader.tsx
import React from 'react';
import { useTMA } from '../hooks/useTMA';

function TMAHeader() {
  const { user, tg } = useTMA();

  const handleClose = () => {
    if (tg) {
      tg.close();
    }
  };

  return (
    <header style={{
      padding: '10px',
      backgroundColor: tg?.colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
      color: tg?.colorScheme === 'dark' ? '#ffffff' : '#000000',
      borderBottom: '1px solid #e0e0e0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My TON TMA</h1>
        <button onClick={handleClose} style={{
          padding: '5px 10px',
          backgroundColor: '#0088cc',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}>
          Close
        </button>
      </div>
      {user && (
        <p>Welcome, {user.first_name}!</p>
      )}
    </header>
  );
}
```

## TON Integration in TMA

### TON Connect Setup
```typescript
// src/components/WalletConnect.tsx
import React, { useEffect, useState } from 'react';
import { TonConnectUI } from '@tonconnect/ui';
import { useTMA } from '../hooks/useTMA';

function WalletConnect() {
  const { tg } = useTMA();
  const [tonConnectUI, setTonConnectUI] = useState<TonConnectUI | null>(null);

  useEffect(() => {
    if (tg) {
      // Initialize TON Connect with TMA-specific settings
      const tonConnect = new TonConnectUI({
        manifestUrl: '/tonconnect-manifest.json',
        uiOptions: {
          language: tg.initDataUnsafe?.language_code || 'en',
          uiPreferences: {
            theme: tg.colorScheme || 'light',
            borderRadius: 'm'
          }
        }
      });

      setTonConnectUI(tonConnect);

      // Handle connection
      tonConnect.onStatusChange((wallet) => {
        if (wallet) {
          console.log('Wallet connected:', wallet.account.address);

          // Send connection data to your backend
          fetch('/api/connect-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: wallet.account.address,
              telegramUser: tg.initDataUnsafe?.user,
              initData: tg.initData
            })
          });
        }
      });
    }
  }, [tg]);

  const handleConnect = async () => {
    if (tonConnectUI) {
      await tonConnectUI.connectWallet();
    }
  };

  if (!tonConnectUI) {
    return <div>Loading...</div>;
  }

  return (
    <div id="ton-connect" style={{ margin: '20px 0' }}>
      {!tonConnectUI.connected ? (
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
          <p>✅ Connected</p>
          <p>Address: {tonConnectUI.account?.address.slice(0, 10)}...</p>
        </div>
      )}
    </div>
  );
}
```

### Transaction Handling
```typescript
// src/utils/transactions.ts
import { TonConnectUI } from '@tonconnect/ui';

export async function sendTransaction(
  tonConnectUI: TonConnectUI,
  toAddress: string,
  amount: string,
  comment?: string
) {
  const messages = [{
    address: toAddress,
    amount: amount,
    payload: comment ? Buffer.from(comment).toString('base64') : undefined
  }];

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

## TMA-Specific Features

### Cloud Storage
```typescript
// Store user preferences
function saveUserPreference(key: string, value: string) {
  if (window.Telegram?.WebApp?.CloudStorage) {
    window.Telegram.WebApp.CloudStorage.setItem(key, value);
  }
}

// Retrieve user preferences
function getUserPreference(key: string) {
  return new Promise((resolve) => {
    if (window.Telegram?.WebApp?.CloudStorage) {
      window.Telegram.WebApp.CloudStorage.getItem(key, (value) => {
        resolve(value);
      });
    } else {
      resolve(null);
    }
  });
}
```

### Haptic Feedback
```typescript
// Provide tactile feedback
function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy') {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
  }
}

// Notification feedback
function notifySuccess() {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }
}
```

### Biometric Authentication
```typescript
async function requestBiometricAuth() {
  if (window.Telegram?.WebApp?.requestBiometricAuth) {
    try {
      const result = await window.Telegram.WebApp.requestBiometricAuth();
      return result;
    } catch (error) {
      console.error('Biometric auth failed:', error);
      return false;
    }
  }
  return false;
}
```

## Main App Component

```typescript
// src/App.tsx
import React from 'react';
import TMAHeader from './components/TMAHeader';
import WalletConnect from './components/WalletConnect';
import { useTMA } from './hooks/useTMA';

function App() {
  const { tg } = useTMA();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: tg?.colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
      color: tg?.colorScheme === 'dark' ? '#ffffff' : '#000000'
    }}>
      <TMAHeader />
      <main style={{ padding: '20px' }}>
        <h2>TON TMA Example</h2>
        <WalletConnect />

        <div style={{ marginTop: '20px' }}>
          <h3>Features:</h3>
          <ul>
            <li>Telegram Web Apps integration</li>
            <li>TON Connect wallet connection</li>
            <li>Responsive design for mobile</li>
            <li>Theme-aware UI</li>
            <li>Haptic feedback</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
```

## Build Configuration

### Vite Config
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    // Allow Telegram to access the dev server
    cors: true
  },
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
});
```

### TON Connect Manifest
```json
// public/tonconnect-manifest.json
{
  "url": "https://your-tma-domain.com",
  "name": "My TON TMA",
  "iconUrl": "https://your-tma-domain.com/icon.png",
  "description": "Telegram Mini App with TON integration",
  "aboutUrl": "https://your-tma-domain.com/about"
}
```

## Bot Configuration

### Set Web App
1. Message @BotFather: `/setmenubutton`
2. Provide your Web App URL
3. Users can now access your TMA from the bot menu

### Inline Mode (Optional)
1. Message @BotFather: `/setinline`
2. Users can use your TMA inline in any chat

## Testing & Deployment

### Local Testing
```bash
# Start development server
npm run dev

# Test with Telegram Web Apps simulator
# https://webapps.telegram.org/
```

### Deployment
```bash
# Build for production
npm run build

# Deploy to hosting service (Vercel, Netlify, etc.)
# Make sure the domain supports HTTPS
```

### TMA Validation
- Test on mobile Telegram app
- Verify all Telegram Web Apps APIs work
- Check TON Connect integration
- Validate responsive design

## Best Practices

### Security
- Always validate `initData` on your backend
- Never store sensitive data in localStorage
- Use HTTPS for all communications
- Implement proper error handling

### User Experience
- Respect Telegram's theme system
- Provide clear feedback for all actions
- Handle network errors gracefully
- Optimize for mobile performance

### Performance
- Lazy load heavy components
- Minimize bundle size
- Cache static assets
- Use efficient state management

### Accessibility
- Support screen readers
- Provide alternative text for images
- Ensure keyboard navigation works
- Use semantic HTML

## Common TMA Issues

1. **Web App not loading**: Check HTTPS and CORS settings
2. **Wallet connection failing**: Verify manifest URL and domain
3. **Theme not applying**: Check Telegram app version
4. **Viewport issues**: Handle dynamic viewport changes
5. **API calls failing**: Validate initData on backend

## Advanced TMA Features

### Main Button
```typescript
// Control the main button
const mainButton = window.Telegram.WebApp.MainButton;
mainButton.setText('Send Transaction');
mainButton.show();
mainButton.onClick(() => {
  // Handle main action
});
```

### Secondary Button
```typescript
const secondaryButton = window.Telegram.WebApp.SecondaryButton;
secondaryButton.setText('Cancel');
secondaryButton.show();
secondaryButton.onClick(() => {
  // Handle secondary action
});
```

### Settings Button
```typescript
window.Telegram.WebApp.SettingsButton.show();
window.Telegram.WebApp.SettingsButton.onClick(() => {
  // Open settings
});
```

TMAs provide a powerful way to integrate TON blockchain functionality into Telegram's ecosystem. With proper implementation, you can create seamless, secure, and user-friendly blockchain applications that feel native to Telegram.
