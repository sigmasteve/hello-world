import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AndroidLogoIcon, AppleLogoIcon, ScalesIcon } from 'phosphor-react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RadioPill, ToggleRow } from '../components/Selectable';
import { SegmentedControl } from '../components/SegmentedControl';
import { text } from '../theme/text';
import { color, font } from '../theme/tokens';
import { ALERT_DEFS, SOURCES } from '../data/sampleData';
import { useHealthProvider } from '../health/HealthContext';

const SOURCE_ICON: Record<string, React.ComponentType<any>> = {
  'Apple Health': AppleLogoIcon,
  'Health Connect': AndroidLogoIcon,
  'Withings Scale': ScalesIcon,
};

export function SettingsScreen() {
  const health = useHealthProvider();
  const [alerts, setAlerts] = useState(ALERT_DEFS.map((a) => a.defaultOn));
  const [conflict, setConflict] = useState<'device' | 'apple' | 'ask'>('device');
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={text.h2}>Data & account</Text>

      <Card style={{ gap: 12 }} elevated={false}>
        <Text style={text.h4}>Connected sources</Text>
        {SOURCES.map((s) => {
          const Icon = SOURCE_ICON[s.name] ?? ScalesIcon;
          const isThisDevicesPlatform = s.name === health.platformLabel;
          return (
            <View key={s.name} style={styles.sourceRow}>
              <View style={[styles.sourceIcon, { backgroundColor: s.tint }]}>
                <Icon size={18} color={color.text} weight={s.name === 'Apple Health' ? 'fill' : 'regular'} />
              </View>
              <View style={{ flex: 1, gap: 2, minWidth: 130 }}>
                <Text style={styles.sourceName}>{s.name}</Text>
                <Text style={[styles.sourceStatus, { color: s.statusColor }]}>{s.status}</Text>
              </View>
              <Text style={styles.sourceScope}>{s.scope}</Text>
              <Button label={s.action} small variant={isThisDevicesPlatform ? 'primary' : 'secondary'} />
            </View>
          );
        })}
        <Text style={styles.footNote}>
          Hound reads steps, workouts, distance, heart rate and weight. It never writes back to
          either platform.
        </Text>
      </Card>

      <Card style={{ gap: 14 }} elevated={false}>
        <Text style={text.h4}>Conflicts</Text>
        <Text style={styles.footNote}>When two sources report the same day, Hound keeps one. Pick which wins.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <RadioPill label="Highest-fidelity device" selected={conflict === 'device'} onPress={() => setConflict('device')} />
          <RadioPill label="Apple Health first" selected={conflict === 'apple'} onPress={() => setConflict('apple')} />
          <RadioPill label="Ask me each time" selected={conflict === 'ask'} onPress={() => setConflict('ask')} />
        </View>
        <View style={{ gap: 5 }}>
          <Text style={styles.footNote}>Units</Text>
          <SegmentedControl
            value={units}
            onChange={setUnits}
            options={[
              { value: 'imperial', label: 'Miles / lb' },
              { value: 'metric', label: 'Km / kg' },
            ]}
          />
        </View>
      </Card>

      <Card style={{ gap: 14 }} elevated={false}>
        <Text style={text.h4}>Alerts</Text>
        {ALERT_DEFS.map((a, i) => (
          <ToggleRow
            key={a.label}
            label={a.label}
            note={a.note}
            value={alerts[i]}
            onChange={(v) => setAlerts((cur) => cur.map((x, j) => (j === i ? v : x)))}
          />
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 48 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(233,233,237,0.07)',
    flexWrap: 'wrap',
  },
  sourceIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sourceName: { fontSize: 14.5, color: color.text },
  sourceStatus: { fontSize: 12 },
  sourceScope: { fontSize: 12, color: 'rgba(233,233,237,0.55)' },
  footNote: { fontSize: 12.5, color: 'rgba(233,233,237,0.55)' },
});
