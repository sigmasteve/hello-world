import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color } from '../theme/tokens';

type Variant = 'accent' | 'neutral' | 'outline';

export function Tag({ label, variant = 'neutral' }: { label: string; variant?: Variant }) {
  return (
    <View style={[styles.base, variantStyles[variant]]}>
      <Text style={[styles.label, variantText[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 11, letterSpacing: 0.3 },
});

const variantStyles = StyleSheet.create({
  accent: { backgroundColor: color.accent800 },
  neutral: { backgroundColor: color.neutral800 },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: color.accent },
});

const variantText = StyleSheet.create({
  accent: { color: color.accent100 },
  neutral: { color: color.neutral100 },
  outline: { color: color.accent },
});
