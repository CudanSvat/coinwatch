import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {getPairDetail} from '../api/dexscreener';
import {DexChart} from '../components/DexChart';
import {PriceChangePill} from '../components/PriceChangePill';
import {Skeleton} from '../components/Skeleton';
import {useFavoritesContext} from '../store/FavoritesContext';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme';
import type {PairData} from '../types/dex';
import type {RootStackParamList} from '../navigation/AppNavigator';

type RouteProps = RouteProp<RootStackParamList, 'TokenDetail'>;
type NavProp = StackNavigationProp<RootStackParamList>;

function formatUsd(value?: number | null): string {
  if (!value && value !== 0) {
    return '—';
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatPrice(price?: string | null): string {
  if (!price) {
    return '—';
  }
  const num = parseFloat(price);
  if (isNaN(num)) {
    return '—';
  }
  if (num < 0.000001) {
    return `$${num.toExponential(4)}`;
  }
  if (num < 0.001) {
    return `$${num.toFixed(8)}`;
  }
  if (num < 1) {
    return `$${num.toFixed(6)}`;
  }
  return `$${num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}`;
}

interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
}

function StatCard({label, value, valueColor}: StatCardProps) {
  return (
    <View style={statCardStyles.card}>
      <Text style={statCardStyles.label}>{label}</Text>
      <Text
        style={[
          statCardStyles.value,
          valueColor ? {color: valueColor} : null,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '45%',
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});

export function TokenDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const {chainId, pairAddress, baseTokenSymbol, baseTokenName} = route.params;

  const {addFavorite, removeFavorite, isFavorite} = useFavoritesContext();
  const [pair, setPair] = useState<PairData | null>(null);
  const [loading, setLoading] = useState(true);

  const favorited = isFavorite(chainId, pairAddress);

  useEffect(() => {
    getPairDetail(chainId, pairAddress)
      .then(data => setPair(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [chainId, pairAddress]);

  const toggleFavorite = useCallback(async () => {
    if (favorited) {
      await removeFavorite(chainId, pairAddress);
    } else {
      await addFavorite({
        chainId,
        pairAddress,
        baseTokenSymbol: pair?.baseToken.symbol ?? baseTokenSymbol,
        baseTokenName: pair?.baseToken.name ?? baseTokenName,
        quoteTokenSymbol: pair?.quoteToken.symbol ?? '',
        imageUrl: pair?.info?.imageUrl,
      });
    }
  }, [
    favorited,
    chainId,
    pairAddress,
    pair,
    baseTokenSymbol,
    baseTokenName,
    addFavorite,
    removeFavorite,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          {loading ? (
            <Skeleton width={120} height={18} />
          ) : (
            <>
              {pair?.info?.imageUrl && (
                <Image
                  source={{uri: pair.info.imageUrl}}
                  style={styles.headerLogo}
                />
              )}
              <Text style={styles.headerSymbol} numberOfLines={1}>
                {pair?.baseToken.symbol ?? baseTokenSymbol}
                <Text style={styles.headerQuote}>
                  /{pair?.quoteToken.symbol ?? ''}
                </Text>
              </Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.starBtn} onPress={toggleFavorite}>
          <Text style={styles.starIcon}>{favorited ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Price Section */}
        <View style={styles.priceSection}>
          {loading ? (
            <>
              <Skeleton width={180} height={36} borderRadius={8} />
              <View style={styles.changeRow}>
                <Skeleton width={80} height={22} borderRadius={BorderRadius.full} style={{marginTop: 8}} />
                <Skeleton width={80} height={22} borderRadius={BorderRadius.full} style={{marginTop: 8}} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.price}>{formatPrice(pair?.priceUsd)}</Text>
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>5m</Text>
                <PriceChangePill value={pair?.priceChange?.m5} size="sm" />
                <Text style={styles.changeLabel}>1h</Text>
                <PriceChangePill value={pair?.priceChange?.h1} size="sm" />
                <Text style={styles.changeLabel}>24h</Text>
                <PriceChangePill value={pair?.priceChange?.h24} size="sm" />
              </View>
            </>
          )}
        </View>

        {/* Chart */}
        <DexChart chainId={chainId} pairAddress={pairAddress} height={420} />

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          {loading ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{marginVertical: Spacing.base}}
            />
          ) : (
            <View style={styles.statsGrid}>
              <StatCard label="Market Cap" value={formatUsd(pair?.marketCap)} />
              <StatCard label="FDV" value={formatUsd(pair?.fdv)} />
              <StatCard label="Liquidity" value={formatUsd(pair?.liquidity?.usd)} />
              <StatCard label="Volume 24h" value={formatUsd(pair?.volume?.h24)} />
              <StatCard label="Volume 6h" value={formatUsd(pair?.volume?.h6)} />
              <StatCard label="Volume 1h" value={formatUsd(pair?.volume?.h1)} />
              <StatCard
                label="Buys 24h"
                value={`${pair?.txns?.h24?.buys ?? '—'}`}
                valueColor={Colors.positive}
              />
              <StatCard
                label="Sells 24h"
                value={`${pair?.txns?.h24?.sells ?? '—'}`}
                valueColor={Colors.negative}
              />
              <StatCard label="DEX" value={pair?.dexId?.toUpperCase() ?? '—'} />
              <StatCard
                label="Chain"
                value={pair?.chainId?.toUpperCase() ?? chainId.toUpperCase()}
              />
            </View>
          )}
        </View>

        {/* Add/Remove favorite CTA */}
        <TouchableOpacity
          style={[
            styles.favButton,
            favorited ? styles.favButtonActive : null,
          ]}
          onPress={toggleFavorite}>
          <Text style={styles.favButtonText}>
            {favorited ? '★  Remove from Watchlist' : '☆  Add to Watchlist'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.sm,
  },
  backArrow: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  headerSymbol: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  headerQuote: {
    color: Colors.textSecondary,
    fontWeight: '400',
    fontSize: FontSize.md,
  },
  starBtn: {
    padding: Spacing.sm,
  },
  starIcon: {
    fontSize: 24,
    color: Colors.warning,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  priceSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  price: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  changeLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  statsSection: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  favButton: {
    margin: Spacing.base,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  favButtonActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.warning,
  },
  favButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
});
