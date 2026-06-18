import type {
  GeckoTerminalOhlcvResponse,
  OhlcvCandle,
  OhlcvTimeframe,
} from '../types/dex';

const BASE_URL = 'https://api.geckoterminal.com/api/v2';

// Maps DexScreener chainId values to GeckoTerminal network slugs
const CHAIN_MAP: Record<string, string> = {
  ethereum: 'eth',
  bsc: 'bsc',
  polygon: 'polygon_pos',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  base: 'base',
  avalanche: 'avax',
  solana: 'solana',
  fantom: 'ftm',
  cronos: 'cronos',
};

function toGeckoNetwork(chainId: string): string {
  return CHAIN_MAP[chainId.toLowerCase()] ?? chainId.toLowerCase();
}

export async function getOhlcvCandles(
  chainId: string,
  poolAddress: string,
  timeframe: OhlcvTimeframe = 'hour',
  limit: number = 100,
): Promise<OhlcvCandle[]> {
  const network = toGeckoNetwork(chainId);
  const url = `${BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?limit=${limit}`;

  const response = await fetch(url, {
    headers: {Accept: 'application/json'},
  });

  if (!response.ok) {
    throw new Error(`GeckoTerminal API error: ${response.status}`);
  }

  const data: GeckoTerminalOhlcvResponse = await response.json();
  const raw = data?.data?.attributes?.ohlcv_list ?? [];

  // GeckoTerminal returns [timestamp, open, high, low, close, volume]
  return raw.map(candle => ({
    timestamp: candle[0] * 1000,
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    volume: candle[5],
  }));
}
