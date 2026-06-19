import React, {useCallback, useEffect, useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import {getCoinDetail} from '../api/coingecko';
import {getBinanceCandles, getBinanceTicker, findBinanceSymbol} from '../api/binance';
import {getOhlcvCandles} from '../api/geckoterminal';
import {getPairDetail} from '../api/dexscreener';
import {CandlestickChart} from '../components/CandlestickChart';
import {useFavoritesContext} from '../store/FavoritesContext';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme';
import type {OhlcvCandle, Timeframe, TokenDetailParams} from '../types/dex';
import type {RootStackParamList} from '../navigation/AppNavigator';

type RouteProps = RouteProp<RootStackParamList, 'TokenDetail'>;
type NavProp = StackNavigationProp<RootStackParamList>;

const TIMEFRAMES: {label: string; value: Timeframe}[] = [
  {label: '15m', value: '15m'},
  {label: '1H', value: '1h'},
  {label: '4H', value: '4h'},
  {label: '1D', value: '1d'},
  {label: '1W', value: '1w'},
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v?: number | null, prefix = '$'): string {
  if (v == null) {return '—';}
  if (v >= 1e9) {return `${prefix}${(v / 1e9).toFixed(2)}B`;}
  if (v >= 1e6) {return `${prefix}${(v / 1e6).toFixed(2)}M`;}
  if (v >= 1e3) {return `${prefix}${(v / 1e3).toFixed(2)}K`;}
  return `${prefix}${v.toFixed(2)}`;
}

function fmtPrice(p?: number | null): string {
  if (p == null) {return '—';}
  if (p < 0.000001) {return `$${p.toExponential(4)}`;}
  if (p < 0.0001) {return `$${p.toFixed(8)}`;}
  if (p < 0.01) {return `$${p.toFixed(6)}`;}
  if (p < 1) {return `$${p.toFixed(4)}`;}
  if (p < 10000) {return `$${p.toFixed(2)}`;}
  return `$${p.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function ChangeText({value}: {value?: number | null}) {
  if (value == null) {return <Text style={statStyles.val}>—</Text>;}
  const pos = value >= 0;
  return (
    <Text style={[statStyles.val, {color: pos ? Colors.positive : Colors.negative}]}>
      {pos ? '+' : ''}{value.toFixed(2)}%
    </Text>
  );
}

function StatItem({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  label: {color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5},
  val: {color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700'},
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export function TokenDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const params = route.params as TokenDetailParams;
  const {source, symbol, name, imageUrl} = params;

  const {addFavorite, removeFavorite, isFavorite} = useFavoritesContext();
  const favId = source === 'coingecko'
    ? `cg:${params.coinId}`
    : `dex:${params.pairAddress}`;
  const favorited = isFavorite(favId);

  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [candles, setCandles] = useState<OhlcvCandle[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [change1h, setChange1h] = useState<number | null>(null);
  const [stats, setStats] = useState<Record<string, React.ReactNode>>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [resolvedBinanceSymbol, setResolvedBinanceSymbol] = useState<string | null>(
    params.binanceSymbol ?? null,
  );

  // Fetch chart candles whenever timeframe changes
  const loadCandles = useCallback(async (tf: Timeframe) => {
    setChartLoading(true);
    try {
      if (source === 'coingecko') {
        let binSym = resolvedBinanceSymbol;
        if (!binSym) {
          binSym = await findBinanceSymbol(symbol);
          setResolvedBinanceSymbol(binSym);
        }
        if (binSym) {
          const data = await getBinanceCandles(binSym, tf);
          setCandles(data);
        }
      } else if (params.chainId && params.pairAddress) {
        const geckoTf = tf === '15m' ? 'minute' : tf === '1h' || tf === '4h' ? 'hour' : 'day';
        const limit = tf === '1w' ? 200 : 100;
        const data = await getOhlcvCandles(params.chainId, params.pairAddress, geckoTf, limit);
        setCandles(data);
      }
    } catch {
      // keep stale candles
    } finally {
      setChartLoading(false);
    }
  }, [source, symbol, params.chainId, params.pairAddress, resolvedBinanceSymbol]);

  useEffect(() => {
    loadCandles(timeframe);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  // Fetch stats once on mount
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        if (source === 'coingecko' && params.coinId) {
          const [detail, ticker] = await Promise.allSettled([
            getCoinDetail(params.coinId),
            resolvedBinanceSymbol
              ? getBinanceTicker(resolvedBinanceSymbol)
              : Promise.resolve(null),
          ]);
          if (detail.status === 'fulfilled') {
            const md = detail.value.market_data;
            const p = md.current_price?.usd;
            setPrice(p ?? null);
            setChange24h(md.price_change_percentage_24h ?? null);
            setChange1h(md.price_change_percentage_1h_in_currency?.usd ?? null);
            setStats({
              'Market Cap': <Text style={statStyles.val}>{fmt(md.market_cap?.usd)}</Text>,
              'Volume 24h': <Text style={statStyles.val}>{fmt(md.total_volume?.usd)}</Text>,
              'Circulating Supply': <Text style={statStyles.val}>{fmt(md.circulating_supply, '')}</Text>,
              'Total Supply': <Text style={statStyles.val}>{fmt(md.total_supply, '')}</Text>,
              '24h Change': <ChangeText value={md.price_change_percentage_24h} />,
              '1h Change': <ChangeText value={md.price_change_percentage_1h_in_currency?.usd} />,
              'ATH': <Text style={statStyles.val}>{fmtPrice(md.ath?.usd)}</Text>,
              'ATL': <Text style={statStyles.val}>{fmtPrice(md.atl?.usd)}</Text>,
            });
          }
          if (ticker.status === 'fulfilled' && ticker.value) {
            setPrice(ticker.value.price);
            setChange24h(ticker.value.change24h);
          }
        } else if (source === 'dex' && params.chainId && params.pairAddress) {
          const pair = await getPairDetail(params.chainId, params.pairAddress);
          if (pair) {
            setPrice(pair.priceUsd ? parseFloat(pair.priceUsd) : null);
            setChange24h(pair.priceChange?.h24 ?? null);
            setChange1h(pair.priceChange?.h1 ?? null);
            setStats({
              'Market Cap': <Text style={statStyles.val}>{fmt(pair.marketCap)}</Text>,
              'FDV': <Text style={statStyles.val}>{fmt(pair.fdv)}</Text>,
              'Liquidity': <Text style={statStyles.val}>{fmt(pair.liquidity?.usd)}</Text>,
              'Volume 24h': <Text style={statStyles.val}>{fmt(pair.volume?.h24)}</Text>,
              'Volume 1h': <Text style={statStyles.val}>{fmt(pair.volume?.h1)}</Text>,
              'Buys 24h': <Text style={[statStyles.val, {color: Colors.positive}]}>{pair.txns?.h24?.buys ?? '—'}</Text>,
              'Sells 24h': <Text style={[statStyles.val, {color: Colors.negative}]}>{pair.txns?.h24?.sells ?? '—'}</Text>,
              '24h Change': <ChangeText value={pair.priceChange?.h24} />,
              '1h Change': <ChangeText value={pair.priceChange?.h1} />,
              'DEX': <Text style={statStyles.val}>{pair.dexId?.toUpperCase()}</Text>,
            });
          }
        }
      } catch {
        // keep empty stats
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFavorite = useCallback(() => {
    if (favorited) {
      removeFavorite(favId);
    } else {
      addFavorite({
        id: favId,
        source,
        symbol,
        name,
        imageUrl,
        coinId: params.coinId,
        binanceSymbol: resolvedBinanceSymbol ?? undefined,
        chainId: params.chainId,
        pairAddress: params.pairAddress,
        quoteTokenSymbol: params.quoteTokenSymbol,
      });
    }
  }, [favorited, favId, source, symbol, name, imageUrl, params, resolvedBinanceSymbol, addFavorite, removeFavorite]);

  const isPositive = (change24h ?? 0) >= 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerMid}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.headerLogo} />
          ) : null}
          <Text style={styles.headerSymbol}>{symbol}</Text>
          <Text style={styles.headerName}>{name}</Text>
        </View>
        <TouchableOpacity onPress={toggleFavorite} style={styles.starBtn}>
          <Text style={[styles.star, {color: favorited ? Colors.warning : Colors.textMuted}]}>
            {favorited ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{fmtPrice(price)}</Text>
          <View style={[
            styles.changePill,
            {backgroundColor: isPositive ? Colors.positive + '22' : Colors.negative + '22'},
          ]}>
            <Text style={[styles.changePillText, {color: isPositive ? Colors.positive : Colors.negative}]}>
              {isPositive ? '+' : ''}{(change24h ?? 0).toFixed(2)}%
            </Text>
          </View>
        </View>
        <Text style={styles.priceSubtitle}>
          1h: {change1h != null ? `${change1h >= 0 ? '+' : ''}${change1h.toFixed(2)}%` : '—'}
          {'   '}24h: {change24h != null ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%` : '—'}
        </Text>

        {/* Timeframe selector */}
        <View style={styles.tfRow}>
          {TIMEFRAMES.map(tf => (
            <TouchableOpacity
              key={tf.value}
              style={[styles.tfBtn, timeframe === tf.value && styles.tfBtnActive]}
              onPress={() => setTimeframe(tf.value)}>
              <Text style={[styles.tfText, timeframe === tf.value && styles.tfTextActive]}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <CandlestickChart candles={candles} height={300} loading={chartLoading && candles.length === 0} />

        {/* Stats grid */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Statistics</Text>
          {statsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{marginVertical: Spacing.base}} />
          ) : (
            <View style={styles.statsGrid}>
              {Object.entries(stats).map(([label, val]) => (
                <StatItem key={label} label={label}>{val}</StatItem>
              ))}
            </View>
          )}
        </View>

        {/* Watchlist button */}
        <TouchableOpacity
          style={[styles.favBtn, favorited && styles.favBtnActive]}
          onPress={toggleFavorite}>
          <Text style={styles.favBtnText}>
            {favorited ? '★  Remove from Watchlist' : '☆  Add to Watchlist'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: {padding: Spacing.sm},
  backArrow: {color: Colors.textPrimary, fontSize: FontSize.xl},
  headerMid: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  headerLogo: {width: 26, height: 26, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceAlt},
  headerSymbol: {color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800'},
  headerName: {color: Colors.textSecondary, fontSize: FontSize.sm, flexShrink: 1},
  starBtn: {padding: Spacing.sm},
  star: {fontSize: 24},
  scroll: {paddingBottom: Spacing.xxl},
  priceRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: 4,
  },
  price: {color: Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: '800', letterSpacing: -1},
  changePill: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full},
  changePillText: {fontSize: FontSize.sm, fontWeight: '700'},
  priceSubtitle: {color: Colors.textMuted, fontSize: FontSize.sm, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md},
  tfRow: {
    flexDirection: 'row', gap: Spacing.xs,
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm,
  },
  tfBtn: {
    flex: 1, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tfBtnActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  tfText: {color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600'},
  tfTextActive: {color: Colors.white},
  statsSection: {
    margin: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.border,
  },
  statsTitle: {color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700', marginBottom: Spacing.md},
  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm},
  favBtn: {
    marginHorizontal: Spacing.base, marginTop: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center',
  },
  favBtnActive: {backgroundColor: Colors.primary + '22', borderColor: Colors.warning},
  favBtnText: {color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700'},
});
