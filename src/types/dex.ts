// ─── DexScreener ────────────────────────────────────────────────────────────

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
    m5: {buys: number; sells: number};
    h1: {buys: number; sells: number};
    h6: {buys: number; sells: number};
    h24: {buys: number; sells: number};
  };
  volume: {h24: number; h6: number; h1: number; m5: number};
  priceChange: {m5: number; h1: number; h6: number; h24: number};
  liquidity?: {usd?: number; base: number; quote: number};
  fdv?: number;
  marketCap?: number;
  info?: {
    imageUrl?: string;
    websites?: {label: string; url: string}[];
    socials?: {type: string; url: string}[];
  };
}

export interface DexSearchResponse {
  schemaVersion: string;
  pairs: PairData[] | null;
}

export interface DexTokenResponse {
  schemaVersion: string;
  pairs: PairData[] | null;
}

// ─── GeckoTerminal ───────────────────────────────────────────────────────────

export interface OhlcvCandle {
  timestamp: number; // ms
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
    attributes: {ohlcv_list: number[][]};
  };
}

// ─── CoinGecko ───────────────────────────────────────────────────────────────

export interface CoinGeckoSearchCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string; // small image URL
  large: string;
  market_cap_rank?: number;
}

export interface CoinGeckoSearchResponse {
  coins: CoinGeckoSearchCoin[];
}

export interface CoinGeckoMarketData {
  current_price: {usd: number};
  price_change_percentage_1h_in_currency?: {usd?: number};
  price_change_percentage_24h?: number;
  price_change_percentage_7d?: number;
  market_cap: {usd: number};
  total_volume: {usd: number};
  circulating_supply?: number;
  total_supply?: number;
  ath?: {usd: number};
  atl?: {usd: number};
}

export interface CoinGeckoCoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: {thumb: string; small: string; large: string};
  market_data: CoinGeckoMarketData;
  description?: {en?: string};
}

// ─── Unified token types ─────────────────────────────────────────────────────

export type TokenSource = 'coingecko' | 'dex';

export interface TokenDetailParams {
  source: TokenSource;
  // common
  symbol: string;
  name: string;
  imageUrl?: string;
  // coingecko
  coinId?: string;
  binanceSymbol?: string; // e.g. BTCUSDT
  // dex
  chainId?: string;
  pairAddress?: string;
  quoteTokenSymbol?: string;
}

export interface FavoriteItem {
  id: string; // `${source}:${coinId || pairAddress}`
  source: TokenSource;
  symbol: string;
  name: string;
  imageUrl?: string;
  // coingecko
  coinId?: string;
  binanceSymbol?: string;
  // dex
  chainId?: string;
  pairAddress?: string;
  quoteTokenSymbol?: string;
  addedAt: number;
}

export type Timeframe = '15m' | '1h' | '4h' | '1d' | '1w';
export type OhlcvTimeframe = 'minute' | 'hour' | 'day';
