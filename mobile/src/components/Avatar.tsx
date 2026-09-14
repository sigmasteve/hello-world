import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { font } from '../theme/tokens';

export function Avatar({
  initials,
  tint,
  size = 34,
  fontSize = 12,
}: {
  initials: string;
  tint: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: tint },
      ]}
    >
      <Text style={[styles.label, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: font.headingSemibold, color: '#fff' },
});
