import { useState, useEffect } from 'react';
import { TonClient } from '@ton/ton';

export function useTonClient() {
  const [client, setClient] = useState<TonClient | null>(null);

  useEffect(() => {
    const endpoint = process.env.REACT_APP_TON_NETWORK === 'mainnet'
      ? 'https://toncenter.com/api/v2/jsonRPC'
      : 'https://testnet.toncenter.com/api/v2/jsonRPC';

    const apiKey = process.env.REACT_APP_TON_API_KEY || '';
    
    setClient(new TonClient({
      endpoint,
      apiKey,
    }));
  }, []);

  return { client };
}

