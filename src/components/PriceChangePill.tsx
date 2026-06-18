import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, FontSize, BorderRadius, Spacing} from '../theme';

interface Props {
  value?: number | null;
  size?: 'sm' | 'md';
}

export function PriceChangePill({value, size = 'md'}: Props) {
  if (value === undefined || value === null) {
    return null;
  }
  const isPositive = value >= 0;
  const color = isPositive ? Colors.positive : Colors.negative;
  const bg = isPositive ? Colors.positive + '22' : Colors.negative + '22';
  const label = `${isPositive ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <View style={[styles.pill, {backgroundColor: bg}, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, {color}, size === 'sm' && styles.smText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  smText: {
    fontSize: FontSize.xs,
  },
});
