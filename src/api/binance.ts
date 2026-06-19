import type {OhlcvCandle, Timeframe} from '../types/dex';

const BASE_URL = 'https://api.binance.com/api/v3';

const INTERVAL_MAP: Record<Timeframe, string> = {
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

const LIMIT_MAP: Record<Timeframe, number> = {
  '15m': 200,
  '1h': 200,
  '4h': 200,
  '1d': 365,
  '1w': 200,
};

export async function getBinanceCandles(
  symbol: string, // e.g. 'BTCUSDT'
  timeframe: Timeframe,
): Promise<OhlcvCandle[]> {
  const interval = INTERVAL_MAP[timeframe];
  const limit = LIMIT_MAP[timeframe];
  const url = `${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Binance API error: ${res.status}`);
  }

  // [openTime, open, high, low, close, volume, closeTime, ...]
  const raw: string[][] = await res.json();
  return raw.map(k => ({
    timestamp: Number(k[0]),
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// Try SYMBOL+USDT, then SYMBOL+USDC, then SYMBOL+BTC as quote
export async function findBinanceSymbol(
  coinSymbol: string,
): Promise<string | null> {
  const candidates = [
    `${coinSymbol.toUpperCase()}USDT`,
    `${coinSymbol.toUpperCase()}USDC`,
    `${coinSymbol.toUpperCase()}BTC`,
  ];
  for (const sym of candidates) {
    try {
      const res = await fetch(
        `${BASE_URL}/ticker/price?symbol=${sym}`,
      );
      if (res.ok) {
        return sym;
      }
    } catch {
      // try next
    }
  }
  return null;
}

export async function getBinanceTicker(symbol: string): Promise<{
  price: number;
  change24h: number;
  volume24h: number;
} | null> {
  try {
    const [tickerRes, statsRes] = await Promise.all([
      fetch(`${BASE_URL}/ticker/price?symbol=${symbol}`),
      fetch(`${BASE_URL}/ticker/24hr?symbol=${symbol}`),
    ]);
    if (!tickerRes.ok || !statsRes.ok) {
      return null;
    }
    const ticker = await tickerRes.json();
    const stats = await statsRes.json();
    return {
      price: parseFloat(ticker.price),
      change24h: parseFloat(stats.priceChangePercent),
      volume24h: parseFloat(stats.quoteVolume),
    };
  } catch {
    return null;
  }
}
