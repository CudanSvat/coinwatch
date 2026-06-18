import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Skeleton} from './Skeleton';
import {Colors, Spacing, BorderRadius} from '../theme';

export function TokenCardSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width={40} height={40} borderRadius={BorderRadius.full} />
      <View style={styles.info}>
        <Skeleton width={80} height={14} />
        <Skeleton width={120} height={11} style={{marginTop: 6}} />
      </View>
      <View style={styles.right}>
        <Skeleton width={70} height={14} />
        <Skeleton width={50} height={11} style={{marginTop: 6}} />
      </View>
    </View>
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
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
