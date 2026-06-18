export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
}

export interface PairData {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  info?: {
    imageUrl?: string;
    websites?: { label: string; url: string }[];
    socials?: { type: string; url: string }[];
  };
  boosts?: { active: number };
}

export interface DexSearchResponse {
  schemaVersion: string;
  pairs: PairData[] | null;
}

export interface DexTokenResponse {
  schemaVersion: string;
  pairs: PairData[] | null;
}

export interface OhlcvCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface GeckoTerminalOhlcvResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      ohlcv_list: number[][];
    };
  };
}

export interface FavoritePair {
  chainId: string;
  pairAddress: string;
  baseTokenSymbol: string;
  baseTokenName: string;
  quoteTokenSymbol: string;
  imageUrl?: string;
  addedAt: number;
}

export type Timeframe = '5m' | '1h' | '4h' | '1d';
export type OhlcvTimeframe = 'minute' | 'hour' | 'day';
