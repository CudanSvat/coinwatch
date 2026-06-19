import React, {useCallback, useEffect, useState} from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, TouchableOpacity, StatusBar, Image,
} from 'react-native';
import {useNavigation, CompositeNavigationProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useFavoritesContext} from '../store/FavoritesContext';
import {getMultipleCoinsMarket} from '../api/coingecko';
import {getMultiplePairs} from '../api/dexscreener';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme';
import {TokenCardSkeleton} from '../components/TokenCardSkeleton';
import type {FavoriteItem, TokenDetailParams} from '../types/dex';
import type {RootStackParamList, MainTabParamList} from '../navigation/AppNavigator';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Watchlist'>,
  StackNavigationProp<RootStackParamList>
>;

interface EnrichedFav {
  fav: FavoriteItem;
  price?: number;
  change24h?: number;
  imageUrl?: string;
  volume24h?: number;
  sparkline?: number[];
}

function fmtPrice(p?: number): string {
  if (p == null) {return '—';}
  if (p < 0.000001) {return `$${p.toExponential(2)}`;}
  if (p < 0.0001) {return `$${p.toFixed(8)}`;}
  if (p < 0.01) {return `$${p.toFixed(6)}`;}
  if (p < 1) {return `$${p.toFixed(4)}`;}
  return `$${p.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function fmtVol(v?: number): string {
  if (!v) {return '—';}
  if (v >= 1e9) {return `$${(v / 1e9).toFixed(1)}B`;}
  if (v >= 1e6) {return `$${(v / 1e6).toFixed(1)}M`;}
  if (v >= 1e3) {return `$${(v / 1e3).toFixed(1)}K`;}
  return `$${v.toFixed(0)}`;
}

function FavRow({item, onPress}: {item: EnrichedFav; onPress: () => void}) {
  const isPos = (item.change24h ?? 0) >= 0;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {item.imageUrl ? (
        <Image source={{uri: item.imageUrl}} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoFallback]}>
          <Text style={styles.logoLetter}>{item.fav.symbol.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowSymbol}>{item.fav.symbol}</Text>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.fav.name}
          {item.fav.source === 'dex' && item.fav.chainId
            ? ` · ${item.fav.chainId.toUpperCase()}`
            : ''}
        </Text>
        <Text style={styles.rowVol}>Vol {fmtVol(item.volume24h)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{fmtPrice(item.price)}</Text>
        <Text style={[styles.rowChange, {color: isPos ? Colors.positive : Colors.negative}]}>
          {item.change24h != null
            ? `${isPos ? '+' : ''}${item.change24h.toFixed(2)}%`
            : '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function FavoritesScreen() {
  const navigation = useNavigation<NavProp>();
  const {favorites, loading: favLoading} = useFavoritesContext();
  const [enriched, setEnriched] = useState<EnrichedFav[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const loadData = useCallback(async () => {
    if (favorites.length === 0) {
      setEnriched([]);
      setInitialLoad(false);
      return;
    }

    // Start with skeleton placeholders
    const base: EnrichedFav[] = favorites.map(fav => ({fav}));
    setEnriched(base);

    // Fetch CoinGecko coins and DEX pairs in parallel
    const cgFavs = favorites.filter(f => f.source === 'coingecko' && f.coinId);
    const dexFavs = favorites.filter(f => f.source === 'dex' && f.chainId && f.pairAddress);

    const [cgResult, dexResult] = await Promise.allSettled([
      cgFavs.length > 0
        ? getMultipleCoinsMarket(cgFavs.map(f => f.coinId!))
        : Promise.resolve([]),
      dexFavs.length > 0
        ? getMultiplePairs(dexFavs.map(f => ({chainId: f.chainId!, pairAddress: f.pairAddress!})))
        : Promise.resolve([]),
    ]);

    const updated: EnrichedFav[] = favorites.map(fav => {
      if (fav.source === 'coingecko' && cgResult.status === 'fulfilled') {
        const coin = cgResult.value.find(c => c.id === fav.coinId);
        if (coin) {
          return {
            fav,
            price: coin.current_price,
            change24h: coin.price_change_percentage_24h,
            imageUrl: coin.image ?? fav.imageUrl,
            volume24h: coin.total_volume,
            sparkline: coin.sparkline_in_7d?.price,
          };
        }
      }
      if (fav.source === 'dex' && dexResult.status === 'fulfilled') {
        const pair = dexResult.value.find(p => p.pairAddress === fav.pairAddress);
        if (pair) {
          return {
            fav,
            price: pair.priceUsd ? parseFloat(pair.priceUsd) : undefined,
            change24h: pair.priceChange?.h24,
            imageUrl: pair.info?.imageUrl ?? fav.imageUrl,
            volume24h: pair.volume?.h24,
          };
        }
      }
      return {fav, imageUrl: fav.imageUrl};
    });

    setEnriched(updated);
    setInitialLoad(false);
  }, [favorites]);

  useEffect(() => {
    if (!favLoading) {
      loadData();
    }
  }, [favLoading, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const openDetail = useCallback((fav: FavoriteItem) => {
    const params: TokenDetailParams = {
      source: fav.source,
      symbol: fav.symbol,
      name: fav.name,
      imageUrl: fav.imageUrl,
      coinId: fav.coinId,
      binanceSymbol: fav.binanceSymbol,
      chainId: fav.chainId,
      pairAddress: fav.pairAddress,
      quoteTokenSymbol: fav.quoteTokenSymbol,
    };
    navigation.navigate('TokenDetail', params);
  }, [navigation]);

  if (initialLoad || favLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.header}>
          <Text style={styles.title}>Watchlist</Text>
        </View>
        {[1, 2, 3, 4].map(i => <TokenCardSkeleton key={i} />)}
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.header}>
          <Text style={styles.title}>Watchlist</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyTitle}>No coins yet</Text>
          <Text style={styles.emptySubtitle}>Search for tokens to add to your watchlist</Text>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => navigation.navigate('Search')}>
            <Text style={styles.searchBtnText}>Search Tokens</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Watchlist</Text>
        <Text style={styles.count}>{favorites.length} coins</Text>
      </View>
      <FlatList
        data={enriched}
        keyExtractor={item => item.fav.id}
        renderItem={({item}) => (
          <FavRow item={item} onPress={() => openDetail(item.fav)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  title: {color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '800'},
  count: {color: Colors.textSecondary, fontSize: FontSize.sm},
  listContent: {paddingBottom: Spacing.xxl},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxl},
  emptyIcon: {fontSize: 56},
  emptyTitle: {color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700'},
  emptySubtitle: {color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22},
  searchBtn: {marginTop: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full},
  searchBtnText: {color: Colors.white, fontSize: FontSize.base, fontWeight: '700'},
  // Row
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border + '55',
    gap: Spacing.md,
  },
  logo: {width: 42, height: 42, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceAlt},
  logoFallback: {justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary + '22'},
  logoLetter: {color: Colors.primary, fontSize: FontSize.base, fontWeight: '700'},
  rowInfo: {flex: 1, gap: 3},
  rowSymbol: {color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700'},
  rowName: {color: Colors.textSecondary, fontSize: FontSize.sm},
  rowVol: {color: Colors.textMuted, fontSize: FontSize.xs},
  rowRight: {alignItems: 'flex-end', gap: 3},
  rowPrice: {color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600'},
  rowChange: {fontSize: FontSize.sm, fontWeight: '600'},
});
