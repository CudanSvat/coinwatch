import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useNavigation, CompositeNavigationProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useFavoritesContext} from '../store/FavoritesContext';
import {getMultiplePairs} from '../api/dexscreener';
import {TokenCard} from '../components/TokenCard';
import {TokenCardSkeleton} from '../components/TokenCardSkeleton';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme';
import type {PairData} from '../types/dex';
import type {RootStackParamList, MainTabParamList} from '../navigation/AppNavigator';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Watchlist'>,
  StackNavigationProp<RootStackParamList>
>;

function generateSparkline(pair: PairData): number[] {
  // Generate a synthetic 7-point sparkline from available price-change data
  const p = parseFloat(pair.priceUsd ?? '1') || 1;
  const c5m = (pair.priceChange?.m5 ?? 0) / 100;
  const c1h = (pair.priceChange?.h1 ?? 0) / 100;
  const c6h = (pair.priceChange?.h6 ?? 0) / 100;
  const c24h = (pair.priceChange?.h24 ?? 0) / 100;

  // Reconstruct approximate past prices
  const p24h = p / (1 + c24h);
  const p6h = p / (1 + c6h);
  const p1h = p / (1 + c1h);
  const p5m = p / (1 + c5m);

  return [
    p24h,
    p24h * (1 + c24h * 0.25),
    p24h * (1 + c24h * 0.5),
    p6h,
    p1h,
    p5m,
    p,
  ];
}

export function FavoritesScreen() {
  const navigation = useNavigation<NavProp>();
  const {favorites, loading: favLoading} = useFavoritesContext();
  const [pairs, setPairs] = useState<PairData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const loadPairs = useCallback(async () => {
    if (favorites.length === 0) {
      setPairs([]);
      setInitialLoad(false);
      return;
    }
    try {
      const data = await getMultiplePairs(favorites);
      setPairs(data);
    } catch {
      // keep stale data on failure
    } finally {
      setInitialLoad(false);
    }
  }, [favorites]);

  useEffect(() => {
    if (!favLoading) {
      loadPairs();
    }
  }, [favLoading, loadPairs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPairs();
    setRefreshing(false);
  }, [loadPairs]);

  const handlePress = useCallback(
    (pair: PairData) => {
      navigation.navigate('TokenDetail', {
        chainId: pair.chainId,
        pairAddress: pair.pairAddress,
        baseTokenSymbol: pair.baseToken.symbol,
        baseTokenName: pair.baseToken.name,
        quoteTokenSymbol: pair.quoteToken.symbol,
      });
    },
    [navigation],
  );

  if (initialLoad || favLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.header}>
          <Text style={styles.title}>Watchlist</Text>
        </View>
        {[1, 2, 3, 4, 5].map(i => (
          <TokenCardSkeleton key={i} />
        ))}
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyTitle}>No coins yet</Text>
          <Text style={styles.emptySubtitle}>
            Search for tokens to add to your watchlist
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('Search')}>
            <Text style={styles.searchButtonText}>Search Tokens</Text>
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
        data={pairs}
        keyExtractor={item => `${item.chainId}-${item.pairAddress}`}
        renderItem={({item}) => (
          <TokenCard
            pair={item}
            sparklineData={generateSparkline(item)}
            onPress={() => handlePress(item)}
          />
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  count: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  searchButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
});
