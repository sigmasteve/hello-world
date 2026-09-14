import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font } from '../theme/tokens';

// Radio pill used in "What counts" / "Conflicts" / "Units" rows.
export function RadioPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.pill}>
      <View style={[styles.dot, selected && styles.dotOn]} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

// Toggle row used in Alerts settings.
export function ToggleRow({
  label,
  note,
  value,
  onChange,
}: {
  label: string;
  note: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
      <View style={[styles.checkbox, value && styles.checkboxOn]} />
      <Text style={[styles.label, styles.toggleLabel]}>{label}</Text>
      <Text style={styles.note}>{note}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.divider,
    borderRadius: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: color.divider,
  },
  dotOn: {
    borderColor: color.accent,
    backgroundColor: color.accent,
  },
  label: { fontFamily: font.body, fontSize: 14, color: color.text },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { flex: 1 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: color.divider,
  },
  checkboxOn: { backgroundColor: color.accent, borderColor: color.accent },
  note: { fontSize: 12, color: 'rgba(233,233,237,0.55)' },
});
