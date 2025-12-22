# 🚀 TON Telegram Mini App - MCP Generated

A complete Telegram Mini App built using TON MCP tools, featuring smart contracts and wallet integration.

## ✨ Features

- **🤖 MCP Integration**: Built using TON MCP tools for contract generation and network queries
- **📱 Telegram Mini App**: Full Telegram Web App API integration
- **🔗 TON Wallet Connection**: TonConnect UI integration for seamless wallet connections
- **⚡ Smart Contracts**: Three Tact contracts generated via MCP:
  - Counter contract for basic state management
  - Wallet contract for TON wallet operations
  - TMAProfile contract for user profiles and activity tracking
- **🌐 Live Network Data**: Real-time TON network status and gas prices
- **🎨 Modern UI**: Responsive design optimized for mobile devices

## 🏗️ Project Structure

```
tma-contract-cursor/
├── contracts/           # Tact smart contracts (MCP generated)
│   ├── Counter.tact    # Simple counter contract
│   ├── Wallet.tact     # Wallet contract
│   └── TMAProfile.tact # User profile management
├── src/                # React frontend
│   ├── App.tsx         # Main application component
│   ├── App.css         # Application styles
│   ├── main.tsx        # Application entry point
│   ├── index.css       # Global styles
│   └── types/          # TypeScript type definitions
├── package.json        # Project dependencies
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── tact.config.json    # Tact compiler configuration
└── index.html          # HTML template
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- TON development environment (optional for frontend-only development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Contract Compilation (Optional)

To compile the smart contracts:
```bash
npm run contract:compile
```

*Note: Requires Tact compiler to be installed globally*

## 🔧 MCP Tools Used

This project was built using the following TON MCP tools:

### Contract Generation
- `generate_contract_code` - Generated Counter and Wallet contracts
- Manual creation of TMAProfile contract based on MCP patterns

### Network Queries
- `get_network_status_live` - Real-time TON network information
- `get_account_info_live` - Account balance and state queries

### Frontend Generation
- Custom React components with TON integration
- TonConnect UI integration for wallet connections

## 📱 Telegram Mini App Setup

1. Build the production version:
```bash
npm run build
```

2. Deploy the `dist/` folder to your web server

3. Configure your Telegram bot with the web app URL using BotFather:
   - `/setmenubutton` - Set the menu button
   - Provide your web app URL

## 🎮 Usage

1. **Connect Wallet**: Click "Connect TON Wallet" to link your TON wallet
2. **Counter Contract**: Increment/decrement the counter value
3. **User Profile**: Register a profile and earn activity points
4. **Network Status**: View real-time TON network information

## 🔍 MCP Server Status

**✅ Working Features:**
- Live blockchain queries (network status, account info)
- Contract code generation (Counter, Wallet contracts)
- Basic MCP connectivity

**⚠️ Known Issues:**
- Documentation search returns limited results
- Resource listing not fully populated
- Frontend generation tool has parameter issues

## 🛠️ Development

### Adding New Contracts

Use the MCP contract generation tool:
```javascript
// Generate a new contract type
mcp_ton.generate_contract_code({
  contract_type: "your_contract_type",
  language: "tact"
});
```

### Network Queries

Query live TON blockchain data:
```javascript
// Get network status
const network = await mcp_ton.get_network_status_live();

// Get account information
const account = await mcp_ton.get_account_info_live({
  address: "TON_ADDRESS"
});
```

## 📄 License

MIT License - Built with TON MCP tools for educational and development purposes.

## 🤝 Contributing

This project demonstrates TON MCP tool integration. Feel free to extend it with additional contract types and features!
