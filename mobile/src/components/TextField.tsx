import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { EyeIcon, EyeSlashIcon } from 'phosphor-react-native';
import { color, font, radius, space } from '../theme/tokens';

export function TextField({
  label,
  icon,
  secureToggle,
  error,
  style,
  ...inputProps
}: {
  label: string;
  icon?: React.ReactNode;
  secureToggle?: boolean;
  error?: string;
} & TextInputProps) {
  const [hidden, setHidden] = useState(!!secureToggle);

  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, error && styles.rowError]}>
        {icon}
        <TextInput
          placeholderTextColor="rgba(233,233,237,0.4)"
          style={styles.input}
          secureTextEntry={secureToggle ? hidden : inputProps.secureTextEntry}
          {...inputProps}
        />
        {secureToggle && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            {hidden ? (
              <EyeIcon size={18} color="rgba(233,233,237,0.55)" />
            ) : (
              <EyeSlashIcon size={18} color="rgba(233,233,237,0.55)" />
            )}
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: 'rgba(233,233,237,0.7)', marginBottom: 5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.divider,
  },
  rowError: { borderColor: color.amber },
  input: { flex: 1, color: color.text, fontSize: 15, fontFamily: font.body, paddingVertical: space[2] },
  error: { fontSize: 12, color: color.amber, marginTop: 4 },
});
