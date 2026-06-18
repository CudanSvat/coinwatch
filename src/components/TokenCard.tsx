import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme';
import {SparkLine} from './SparkLine';
import type {PairData} from '../types/dex';

interface Props {
  pair: PairData;
  sparklineData?: number[];
  onPress: () => void;
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
    return `$${num.toExponential(2)}`;
  }
  if (num < 0.01) {
    return `$${num.toFixed(6)}`;
  }
  if (num < 1) {
    return `$${num.toFixed(4)}`;
  }
  return `$${num.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function formatChange(change?: number): string {
  if (change === undefined || change === null) {
    return '—';
  }
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

function formatVolume(vol?: number): string {
  if (!vol) {
    return '—';
  }
  if (vol >= 1_000_000) {
    return `$${(vol / 1_000_000).toFixed(1)}M`;
  }
  if (vol >= 1_000) {
    return `$${(vol / 1_000).toFixed(1)}K`;
  }
  return `$${vol.toFixed(0)}`;
}

function chainBadgeColor(chainId: string): string {
  const map: Record<string, string> = {
    ethereum: '#627EEA',
    bsc: '#F3BA2F',
    solana: '#9945FF',
    polygon: '#8247E5',
    arbitrum: '#12AAFF',
    optimism: '#FF0420',
    base: '#0052FF',
    avalanche: '#E84142',
  };
  return map[chainId?.toLowerCase()] ?? Colors.primary;
}

export function TokenCard({pair, sparklineData, onPress}: Props) {
  const change24h = pair.priceChange?.h24;
  const isPositive = (change24h ?? 0) >= 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        {pair.info?.imageUrl ? (
          <Image source={{uri: pair.info.imageUrl}} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Text style={styles.logoText}>
              {pair.baseToken.symbol.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.tokenInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.symbol} numberOfLines={1}>
              {pair.baseToken.symbol}
            </Text>
            <View
              style={[
                styles.chainBadge,
                {backgroundColor: chainBadgeColor(pair.chainId)},
              ]}>
              <Text style={styles.chainText}>{pair.chainId.toUpperCase().slice(0, 3)}</Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {pair.baseToken.name}
          </Text>
          <Text style={styles.volume}>Vol {formatVolume(pair.volume?.h24)}</Text>
        </View>
      </View>

      <View style={styles.center}>
        {sparklineData && sparklineData.length >= 2 && (
          <SparkLine
            data={sparklineData}
            width={72}
            height={32}
            positive={isPositive}
          />
        )}
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>{formatPrice(pair.priceUsd)}</Text>
        <Text
          style={[
            styles.change,
            {color: isPositive ? Colors.positive : Colors.negative},
          ]}>
          {formatChange(change24h)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '33',
  },
  logoText: {
    color: Colors.primary,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  symbol: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  chainBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  chainText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  name: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  volume: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  center: {
    width: 80,
    alignItems: 'center',
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 80,
  },
  price: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  change: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
