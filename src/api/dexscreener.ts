import type {DexSearchResponse, DexTokenResponse, PairData} from '../types/dex';

const BASE_URL = 'https://api.dexscreener.com/latest/dex';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {'Accept': 'application/json'},
  });
  if (!response.ok) {
    throw new Error(`DexScreener API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function searchPairs(query: string): Promise<PairData[]> {
  if (!query.trim()) {
    return [];
  }
  const data = await fetchJson<DexSearchResponse>(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}`,
  );
  return data.pairs ?? [];
}

export async function getTokenPairs(tokenAddress: string): Promise<PairData[]> {
  const data = await fetchJson<DexTokenResponse>(
    `${BASE_URL}/tokens/${tokenAddress}`,
  );
  return data.pairs ?? [];
}

export async function getPairDetail(
  chainId: string,
  pairAddress: string,
): Promise<PairData | null> {
  const data = await fetchJson<DexTokenResponse>(
    `${BASE_URL}/pairs/${chainId}/${pairAddress}`,
  );
  const pairs = data.pairs ?? [];
  return pairs.length > 0 ? pairs[0] : null;
}

export async function getMultiplePairs(
  pairs: {chainId: string; pairAddress: string}[],
): Promise<PairData[]> {
  const results = await Promise.allSettled(
    pairs.map(({chainId, pairAddress}) => getPairDetail(chainId, pairAddress)),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<PairData> =>
        r.status === 'fulfilled' && r.value !== null,
    )
    .map(r => r.value);
}

export function getDexScreenerEmbedUrl(
  chainId: string,
  pairAddress: string,
): string {
  return `https://dexscreener.com/${chainId}/${pairAddress}?embed=1&theme=dark&trades=0&info=0`;
}
