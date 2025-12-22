export const config = {
  server: {
    name: "ton-mcp",
    version: "1.0.0",
  },
  ton: {
    network: process.env.TON_NETWORK || "mainnet",
    apiEndpoint: process.env.TON_API_ENDPOINT || "https://toncenter.com/api/v2/jsonRPC",
    apiKey: process.env.TON_API_KEY,
  },
  tma: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
  }
};
