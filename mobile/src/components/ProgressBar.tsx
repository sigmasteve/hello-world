import React from 'react';
import { StyleSheet, View } from 'react-native';
import { color } from '../theme/tokens';

export function ProgressBar({
  pct,
  fillColor = color.accent,
  height = 4,
  trackColor = color.neutral800,
}: {
  pct: number; // 0-100
  fillColor?: string;
  height?: number;
  trackColor?: string;
}) {
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}>
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, pct))}%`,
          backgroundColor: fillColor,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
});
