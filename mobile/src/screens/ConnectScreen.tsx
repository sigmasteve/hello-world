import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AndroidLogoIcon, AppleLogoIcon, PawPrintIcon } from 'phosphor-react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { text } from '../theme/text';
import { color, font } from '../theme/tokens';
import { useHealthProvider } from '../health/HealthContext';

export function ConnectScreen({ onDone }: { onDone: () => void }) {
  const health = useHealthProvider();
  const [connecting, setConnecting] = useState<'apple' | 'android' | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const connect = async () => {
    setConnecting(Platform.OS === 'ios' ? 'apple' : 'android');
    const result = await health.requestAuthorization();
    setConnecting(null);
    if (result === 'authorized') {
      onDone();
    } else {
      setStatus(
        health.platform === 'mock'
          ? 'Running on sample data — build a dev client to connect a real device.'
          : `Health access ${result}. You can grant it from your device Settings and try again.`,
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.badge}>
        <PawPrintIcon size={26} color={color.accent} weight="fill" />
      </View>
      <Text style={[text.h2, styles.title]}>Hound needs your health data</Text>
      <Text style={styles.body}>
        Connect the platform your phone already uses. Your friends connect theirs. Hound lines the
        numbers up so a Pixel and an iPhone can race fairly.
      </Text>

      <View style={styles.cardsRow}>
        <Card style={styles.platformCard} elevated={false}>
          <AppleLogoIcon size={24} color={color.text} weight="fill" />
          <Text style={styles.platformName}>Apple Health</Text>
          <Text style={styles.platformSub}>iPhone, Apple Watch, Withings</Text>
          <Button
            label={connecting === 'apple' ? 'Connecting…' : 'Connect'}
            variant="primary"
            block
            small
            disabled={connecting !== null || Platform.OS !== 'ios'}
            onPress={connect}
          />
          {connecting === 'apple' && <ActivityIndicator color={color.accent} />}
        </Card>
        <Card style={styles.platformCard} elevated={false}>
          <AndroidLogoIcon size={24} color={color.text} />
          <Text style={styles.platformName}>Health Connect</Text>
          <Text style={styles.platformSub}>Pixel, Samsung Health, Fitbit, Strava</Text>
          <Button
            label={connecting === 'android' ? 'Connecting…' : 'Connect'}
            variant="primary"
            block
            small
            disabled={connecting !== null || Platform.OS !== 'android'}
            onPress={connect}
          />
          {connecting === 'android' && <ActivityIndicator color={color.accent} />}
        </Card>
      </View>

      {status && <Text style={styles.status}>{status}</Text>}

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Read-only, five metrics</Text>
        <Text style={styles.noticeBody}>
          Steps · Workouts · Distance · Heart rate · Weight. Nothing else is requested, nothing is
          written back, and you can revoke it from your phone&rsquo;s settings at any time.
        </Text>
      </View>

      <Button label="Skip for now" variant="ghost" small onPress={onDone} style={styles.skip} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 24, gap: 20, alignItems: 'center', paddingBottom: 48 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', fontSize: 15, color: 'rgba(233,233,237,0.78)', maxWidth: 420 },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  platformCard: { flexBasis: '46%', flexGrow: 1, gap: 10, padding: 18 },
  platformName: { fontFamily: font.heading, fontSize: 16, color: color.text },
  platformSub: { fontSize: 12.5, color: 'rgba(233,233,237,0.55)' },
  status: { fontSize: 12.5, color: color.amber, textAlign: 'center' },
  notice: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(145,132,217,0.09)',
    gap: 6,
  },
  noticeTitle: { fontFamily: font.heading, fontSize: 12.5, color: color.accent200 },
  noticeBody: { fontSize: 12.5, lineHeight: 18, color: color.accent200 },
  skip: { alignSelf: 'center' },
});
