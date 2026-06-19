import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View, Text, TextInput, FlatList, SectionList,
  StyleSheet, TouchableOpacity, ActivityIndicator,
  StatusBar, Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {searchCoins} from '../api/coingecko';
import {searchPairs} from '../api/dexscreener';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme';
import type {CoinGeckoSearchCoin, PairData, TokenDetailParams} from '../types/dex';
import type {RootStackParamList} from '../navigation/AppNavigator';

type NavProp = StackNavigationProp<RootStackParamList>;

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setD(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return d;
}

function formatPrice(p?: string | null) {
  if (!p) {return '—';}
  const n = parseFloat(p);
  if (isNaN(n)) {return '—';}
  if (n < 0.0001) {return `$${n.toExponential(2)}`;}
  if (n < 1) {return `$${n.toFixed(4)}`;}
  return `$${n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function formatVol(v?: number) {
  if (!v) {return '—';}
  if (v >= 1e9) {return `$${(v / 1e9).toFixed(1)}B`;}
  if (v >= 1e6) {return `$${(v / 1e6).toFixed(1)}M`;}
  if (v >= 1e3) {return `$${(v / 1e3).toFixed(1)}K`;}
  return `$${v.toFixed(0)}`;
}

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA', bsc: '#F3BA2F', solana: '#9945FF',
  polygon: '#8247E5', arbitrum: '#12AAFF', optimism: '#FF0420',
  base: '#0052FF', avalanche: '#E84142',
};

const POPULAR = [
  {label: 'BTC', query: 'bitcoin'},
  {label: 'ETH', query: 'ethereum'},
  {label: 'SOL', query: 'solana'},
  {label: 'PEPE', query: 'pepe'},
  {label: 'WIF', query: 'dogwifhat'},
  {label: 'BONK', query: 'bonk'},
];

// ─── Row components ──────────────────────────────────────────────────────────

function CoinRow({coin, onPress}: {coin: CoinGeckoSearchCoin; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {coin.large ? (
        <Image source={{uri: coin.large}} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoFallback]}>
          <Text style={styles.logoLetter}>{coin.symbol.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowSymbol}>{coin.symbol.toUpperCase()}</Text>
        <Text style={styles.rowName} numberOfLines={1}>{coin.name}</Text>
      </View>
      {coin.market_cap_rank ? (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{coin.market_cap_rank}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function PairRow({pair, onPress}: {pair: PairData; onPress: () => void}) {
  const change = pair.priceChange?.h24;
  const isPos = (change ?? 0) >= 0;
  const chainColor = CHAIN_COLORS[pair.chainId?.toLowerCase()] ?? Colors.primary;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {pair.info?.imageUrl ? (
        <Image source={{uri: pair.info.imageUrl}} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoFallback]}>
          <Text style={styles.logoLetter}>{pair.baseToken.symbol.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <View style={styles.symbolRow}>
          <Text style={styles.rowSymbol}>{pair.baseToken.symbol}</Text>
          <View style={[styles.chainBadge, {backgroundColor: chainColor}]}>
            <Text style={styles.chainText}>{pair.chainId.toUpperCase().slice(0, 3)}</Text>
          </View>
        </View>
        <Text style={styles.rowName} numberOfLines={1}>
          {pair.dexId.toUpperCase()} · Vol {formatVol(pair.volume?.h24)}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{formatPrice(pair.priceUsd)}</Text>
        {change != null && (
          <Text style={[styles.rowChange, {color: isPos ? Colors.positive : Colors.negative}]}>
            {isPos ? '+' : ''}{change.toFixed(2)}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function SearchScreen() {
  const navigation = useNavigation<NavProp>();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [cgCoins, setCgCoins] = useState<CoinGeckoSearchCoin[]>([]);
  const [dexPairs, setDexPairs] = useState<PairData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debouncedQ = useDebounce(query, 450);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setCgCoins([]); setDexPairs([]); setSearched(false); return;
    }
    setLoading(true);
    const [cg, dex] = await Promise.allSettled([
      searchCoins(q),
      searchPairs(q),
    ]);
    setCgCoins(cg.status === 'fulfilled' ? cg.value : []);
    const pairs = dex.status === 'fulfilled' ? dex.value : [];
    setDexPairs(pairs.sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0)).slice(0, 30));
    setSearched(true);
    setLoading(false);
  }, []);

  useEffect(() => { doSearch(debouncedQ); }, [debouncedQ, doSearch]);

  const openCoin = useCallback((coin: CoinGeckoSearchCoin) => {
    const params: TokenDetailParams = {
      source: 'coingecko',
      coinId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      imageUrl: coin.large,
      binanceSymbol: `${coin.symbol.toUpperCase()}USDT`,
    };
    navigation.navigate('TokenDetail', params);
  }, [navigation]);

  const openPair = useCallback((pair: PairData) => {
    const params: TokenDetailParams = {
      source: 'dex',
      chainId: pair.chainId,
      pairAddress: pair.pairAddress,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      imageUrl: pair.info?.imageUrl,
      quoteTokenSymbol: pair.quoteToken.symbol,
    };
    navigation.navigate('TokenDetail', params);
  }, [navigation]);

  const sections = [];
  if (cgCoins.length > 0) {
    sections.push({title: 'Markets', data: cgCoins, type: 'cg'});
  }
  if (dexPairs.length > 0) {
    sections.push({title: 'DEX Pairs', data: dexPairs, type: 'dex'});
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Coin name, symbol, or address..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Popular chips */}
      {!searched && (
        <View style={styles.popularSection}>
          <Text style={styles.popularTitle}>Popular</Text>
          <View style={styles.chips}>
            {POPULAR.map(p => (
              <TouchableOpacity key={p.label} style={styles.chip} onPress={() => setQuery(p.query)}>
                <Text style={styles.chipText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}

      {!loading && searched && cgCoins.length === 0 && dexPairs.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔭</Text>
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
      )}

      {!loading && sections.length > 0 && (
        <SectionList
          sections={sections as any}
          keyExtractor={(item: any, i) => item.id ?? `${item.chainId}-${item.pairAddress}-${i}`}
          renderSectionHeader={({section}) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({item, section}: any) =>
            section.type === 'cg' ? (
              <CoinRow coin={item} onPress={() => openCoin(item)} />
            ) : (
              <PairRow pair={item} onPress={() => openPair(item)} />
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  header: {paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.sm},
  title: {color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '800'},
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: Spacing.base, paddingHorizontal: Spacing.md,
    height: 48, gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  searchIcon: {fontSize: 15},
  input: {flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 0},
  clearBtn: {color: Colors.textSecondary, fontSize: FontSize.sm, padding: 4},
  popularSection: {paddingHorizontal: Spacing.base, paddingTop: Spacing.md, gap: Spacing.sm},
  popularTitle: {color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm},
  chip: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  chipText: {color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600'},
  loadingRow: {paddingVertical: Spacing.xl, alignItems: 'center'},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md},
  emptyIcon: {fontSize: 44},
  emptyText: {color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center'},
  sectionHeader: {
    paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.xs,
  },
  sectionTitle: {color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1},
  listContent: {paddingBottom: Spacing.xxl},
  // Row
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border + '55',
    gap: Spacing.md,
  },
  logo: {width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceAlt},
  logoFallback: {justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary + '22'},
  logoLetter: {color: Colors.primary, fontSize: FontSize.base, fontWeight: '700'},
  rowInfo: {flex: 1, gap: 3},
  symbolRow: {flexDirection: 'row', alignItems: 'center', gap: Spacing.xs},
  rowSymbol: {color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700'},
  rowName: {color: Colors.textSecondary, fontSize: FontSize.sm},
  chainBadge: {paddingHorizontal: 5, paddingVertical: 1, borderRadius: BorderRadius.sm},
  chainText: {color: '#fff', fontSize: FontSize.xs, fontWeight: '700'},
  rankBadge: {backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2},
  rankText: {color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600'},
  rowRight: {alignItems: 'flex-end', gap: 3, minWidth: 75},
  rowPrice: {color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600'},
  rowChange: {fontSize: FontSize.xs, fontWeight: '600'},
});
