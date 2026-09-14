import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { color, radius, ring, space } from '../theme/tokens';

export function Card({
  children,
  style,
  elevated = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
}) {
  return <View style={[styles.card, elevated && styles.ring, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space[3],
    gap: space[2],
  },
  ring: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ring.sm,
  },
});
