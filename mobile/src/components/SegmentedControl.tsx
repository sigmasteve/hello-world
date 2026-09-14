import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font, radius } from '../theme/tokens';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((opt, i) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.opt, i > 0 && styles.divider, on && styles.optOn]}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.divider,
    overflow: 'hidden',
  },
  opt: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  divider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: color.divider },
  optOn: { backgroundColor: 'rgba(145,132,217,0.12)' },
  label: { fontFamily: font.body, fontSize: 13, color: color.text },
  labelOn: { color: color.accent, fontFamily: font.heading },
});
