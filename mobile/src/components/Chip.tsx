import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font } from '../theme/tokens';

export function Chip({
  icon,
  label,
  dotColor,
  trailing,
}: {
  icon?: React.ReactNode;
  label: string;
  dotColor?: string;
  trailing?: string;
}) {
  return (
    <View style={styles.base}>
      {icon}
      <Text style={styles.label}>{label}</Text>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </View>
  );
}

// Smaller neutral-background variant used for source badges inline with text
// ("Apple Health · iPhone 15" next to a name).
export function InlineBadge({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <View style={styles.inline}>
      {icon}
      <Text style={styles.inlineLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.neutral800,
  },
  label: { fontSize: 12, color: color.text },
  dot: { width: 6, height: 6, borderRadius: 3 },
  trailing: { fontSize: 12, color: 'rgba(233,233,237,0.55)' },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
    backgroundColor: color.neutral800,
  },
  inlineLabel: { fontSize: 10, color: color.neutral200, fontFamily: font.body },
});
