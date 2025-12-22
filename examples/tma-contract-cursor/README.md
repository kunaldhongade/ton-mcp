# TON Telegram Mini App with Smart Contracts

This project demonstrates how to build a Telegram Mini App (TMA) that interacts with TON blockchain smart contracts using the ton-mcp toolkit.

## Features

- **Telegram Mini App Integration**: Seamless integration with Telegram Web App API
- **TON Wallet Connection**: Connect TON wallets using TonConnect
- **Smart Contracts**: Two example contracts built with Tact:
  - Counter contract for basic state management
  - TMAProfile contract for user profiles and activity tracking
- **React Frontend**: Modern React application with TypeScript

## Project Structure

```
tma-contract-cursor/
├── contracts/           # Tact smart contracts
│   ├── Counter.tact    # Simple counter contract
│   └── TMAProfile.tact # User profile management
├── src/                # React frontend
│   ├── App.tsx         # Main application component
│   ├── App.css         # Application styles
│   ├── main.tsx        # Application entry point
│   └── types/          # TypeScript type definitions
├── package.json        # Project dependencies
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── tact.config.json    # Tact compiler configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- TON development environment (optional for frontend-only development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the smart contracts:
```bash
npm run contract:build
```

3. Start the development server:
```bash
npm run dev
```

### Deploying to Telegram

1. Build the production version:
```bash
npm run build
```

2. Deploy the `dist/` folder to your web server

3. Configure your Telegram bot with the web app URL using BotFather

## Smart Contracts

### Counter Contract
A simple contract that maintains a counter value with increment/decrement functionality.

### TMAProfile Contract
Manages user profiles for Telegram Mini App users, tracking:
- Telegram user ID
- Username
- Activity points
- Last activity timestamp

## Usage

1. Open the app in Telegram Web App
2. Connect your TON wallet using TonConnect
3. Interact with the counter and profile contracts
4. Register your profile to earn activity points

## Development with ton-mcp

This project was built using the ton-mcp toolkit, which provides:
- Smart contract code generation
- Frontend boilerplate generation
- TON blockchain data access
- Documentation search and integration

## License

MIT License - feel free to use this project as a starting point for your own TON Telegram Mini Apps!
