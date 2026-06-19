import type {
  CoinGeckoSearchResponse,
  CoinGeckoSearchCoin,
  CoinGeckoCoinDetail,
} from '../types/dex';

const BASE_URL = 'https://api.coingecko.com/api/v3';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {Accept: 'application/json'},
  });
  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function searchCoins(
  query: string,
): Promise<CoinGeckoSearchCoin[]> {
  if (!query.trim()) {
    return [];
  }
  const data = await fetchJson<CoinGeckoSearchResponse>(
    `${BASE_URL}/search?query=${encodeURIComponent(query)}`,
  );
  // Return top 10, sorted by market cap rank
  return (data.coins ?? [])
    .sort((a, b) => (a.market_cap_rank ?? 9999) - (b.market_cap_rank ?? 9999))
    .slice(0, 10);
}

export async function getCoinDetail(
  coinId: string,
): Promise<CoinGeckoCoinDetail> {
  return fetchJson<CoinGeckoCoinDetail>(
    `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
  );
}

export async function getMultipleCoinsMarket(
  coinIds: string[],
): Promise<
  {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    total_volume: number;
    sparkline_in_7d?: {price: number[]};
  }[]
> {
  if (coinIds.length === 0) {
    return [];
  }
  const ids = coinIds.join(',');
  return fetchJson(
    `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d`,
  );
}
