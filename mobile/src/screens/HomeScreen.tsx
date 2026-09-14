import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppleLogoIcon,
  ArrowsClockwiseIcon,
  CrosshairIcon,
  FootprintsIcon,
  HeartbeatIcon,
  PathIcon,
  PawPrintIcon,
  ScalesIcon,
  SneakerMoveIcon,
  TrophyIcon,
  WarningIcon,
} from 'phosphor-react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Tag } from '../components/Tag';
import { text } from '../theme/text';
import { color, font } from '../theme/tokens';
import { useHealthProvider } from '../health/HealthContext';
import type { HealthSnapshot } from '../health/types';
import { RACE_BOARD } from '../data/sampleData';
import type { MainTab } from '../navigation/types';

function timeAgo(d: Date | null): string {
  if (!d) return '—';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export function HomeScreen({
  onOpenHunt,
  onGoTab,
}: {
  onOpenHunt: () => void;
  onGoTab: (tab: MainTab) => void;
}) {
  const health = useHealthProvider();
  const [snap, setSnap] = useState<HealthSnapshot | null>(null);

  const reload = useCallback(() => {
    health.getSnapshot().then(setSnap);
  }, [health]);

  useEffect(reload, [reload]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroRow}>
        <View style={styles.heroText}>
          <Text style={text.eyebrow}>TUESDAY · WEEK 3 OF THE HUNT</Text>
          <Text style={[text.h2, styles.heroTitle]}>Marcus is 7.4 mi behind you.</Text>
        </View>
        <Button
          label="Open the chase"
          variant="primary"
          icon={<CrosshairIcon size={15} color={color.accent} />}
          onPress={onOpenHunt}
        />
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <AppleLogoIcon size={14} color={color.text} weight="fill" />
          <Text style={styles.badgeLabel}>Apple Health</Text>
          <View style={[styles.dot, { backgroundColor: color.green }]} />
          <Text style={styles.badgeMuted}>{timeAgo(snap?.lastSyncedAt ?? null)}</Text>
        </View>
        <Pressable style={styles.syncBtn} onPress={reload}>
          <ArrowsClockwiseIcon size={13} color={color.accent} />
          <Text style={styles.syncLabel}>Sync now</Text>
        </Pressable>
      </View>

      <Card style={styles.staleCard} elevated={false}>
        <View style={styles.staleRow}>
          <WarningIcon size={18} color={color.amber} weight="fill" />
          <View style={styles.staleText}>
            <Text style={styles.staleTitle}>Theo&rsquo;s Pixel hasn&rsquo;t reported since Sunday</Text>
            <Text style={styles.staleBody}>
              His step race total is frozen at 41,208. Scores stay provisional until Health Connect
              catches up.
            </Text>
          </View>
          <Button label="Nudge Theo" small onPress={() => onGoTab('friends')} />
        </View>
      </Card>

      <View style={styles.tileGrid}>
        <MetricTile
          label="Steps"
          Icon={FootprintsIcon}
          value={(snap?.stepsToday ?? 0).toLocaleString()}
          sub={`${Math.round(((snap?.stepsToday ?? 0) / (snap?.stepsGoal ?? 10000)) * 100)}% of ${(snap?.stepsGoal ?? 10000).toLocaleString()} · ${snap?.source ?? ''}`}
          pct={((snap?.stepsToday ?? 0) / (snap?.stepsGoal ?? 10000)) * 100}
          onPress={() => onGoTab('metrics')}
        />
        <MetricTile
          label="Distance"
          Icon={PathIcon}
          value={`${(snap?.distanceTodayMi ?? 0).toFixed(1)} mi`}
          sub="1 walk, 1 run logged"
          pct={63}
          onPress={() => onGoTab('metrics')}
        />
        <MetricTile
          label="Resting HR"
          Icon={HeartbeatIcon}
          value={snap?.restingHeartRateBpm != null ? `${snap.restingHeartRateBpm} bpm` : '—'}
          sub="Down 3 bpm over 30 days"
          pct={42}
          barColor={color.accent600}
          onPress={() => onGoTab('metrics')}
        />
        <MetricTile
          label="Weight"
          Icon={ScalesIcon}
          value={snap?.latestWeightLb != null ? `${snap.latestWeightLb} lb` : '—'}
          sub="Last entry Sunday · Withings"
          pct={28}
          barColor={color.accent600}
          onPress={() => onGoTab('metrics')}
        />
      </View>

      <View style={styles.cardsRow}>
        <Card style={styles.huntCard} elevated={false}>
          <View style={styles.huntHeader}>
            <PawPrintIcon size={15} color={color.accent300} weight="fill" />
            <Text style={styles.huntTitle}>The Hunt · Jordan vs Marcus</Text>
            <Tag label="day 9 / 21" variant="outline" />
          </View>
          <View style={styles.huntTrack}>
            <View style={styles.huntTrackLine} />
            <View style={[styles.huntMarker, styles.hunterMarker, { left: '58%' }]}>
              <SneakerMoveIcon size={14} color={color.neutral200} />
            </View>
            <View style={[styles.huntMarker, styles.huntedMarker, { left: '78%' }]}>
              <SneakerMoveIcon size={14} color={color.accent100} weight="fill" />
            </View>
          </View>
          <View style={styles.huntStatsRow}>
            <Text style={styles.huntLead}>
              7.4 mi<Text style={styles.huntLeadSuffix}> lead</Text>
            </Text>
            <Text style={styles.huntNote}>Marcus logged 6.1 mi yesterday. Shrinking fast.</Text>
          </View>
          <Button label="See the tally" variant="primary" small onPress={onOpenHunt} />
        </Card>

        <Card style={styles.raceCard} elevated={false}>
          <View style={styles.raceHeader}>
            <TrophyIcon size={15} color={color.accent} />
            <Text style={styles.raceTitle}>March Step Race</Text>
            <Text style={styles.raceMeta}>5 friends · 4 days left</Text>
          </View>
          {RACE_BOARD.map((row) => (
            <View key={row.rank} style={styles.raceRow}>
              <Text style={styles.raceRank}>{row.rank}</Text>
              <Avatar initials={row.initials} tint={row.tint} size={24} fontSize={10} />
              <Text style={styles.raceName}>{row.name}</Text>
              <ProgressBar pct={row.pct} fillColor={row.bar} height={3} trackColor={color.neutral900} />
              <Text style={[styles.raceSteps, row.highlight && { color: color.accent200 }]}>
                {row.steps}
              </Text>
            </View>
          ))}
          <Button label="Full leaderboard" variant="ghost" small onPress={() => onGoTab('challenges')} />
        </Card>
      </View>
    </ScrollView>
  );
}

function MetricTile({
  label,
  Icon,
  value,
  sub,
  pct,
  barColor = color.accent,
  onPress,
}: {
  label: string;
  Icon: React.ComponentType<any>;
  value: string;
  sub: string;
  pct: number;
  barColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <View style={styles.tileLabelRow}>
        <Icon size={14} color={color.accent} />
        <Text style={styles.tileLabel}>{label.toUpperCase()}</Text>
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <ProgressBar pct={pct} fillColor={barColor} />
      <Text style={styles.tileSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 20, paddingBottom: 48 },
  heroRow: { gap: 14 },
  heroText: { gap: 6 },
  heroTitle: { fontSize: 28 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: color.surface,
  },
  badgeLabel: { fontSize: 12, color: color.text },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeMuted: { fontSize: 12, color: 'rgba(233,233,237,0.55)' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingVertical: 4 },
  syncLabel: { fontSize: 12, color: color.accent, fontFamily: font.heading },
  staleCard: { backgroundColor: '#2a2115', flexDirection: 'row' },
  staleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  staleText: { flex: 1, gap: 2 },
  staleTitle: { fontFamily: font.heading, fontSize: 14, color: color.text },
  staleBody: { fontSize: 13, color: 'rgba(233,233,237,0.78)' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 10,
    padding: 14,
    borderRadius: 8,
    backgroundColor: color.surface,
  },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  tileLabel: { fontSize: 11, letterSpacing: 1, color: color.accent },
  tileValue: { fontFamily: font.heading, fontSize: 28, color: color.text },
  tileSub: { fontSize: 12, color: 'rgba(233,233,237,0.55)' },
  cardsRow: { gap: 12 },
  huntCard: { backgroundColor: '#232a54', gap: 12, padding: 16 },
  huntHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  huntTitle: { fontFamily: font.heading, fontSize: 16, color: color.text, flex: 1 },
  huntTrack: { height: 44, borderRadius: 8, justifyContent: 'center' },
  huntTrackLine: { height: 1, backgroundColor: color.divider },
  huntMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    top: 7,
  },
  hunterMarker: { backgroundColor: color.neutral800 },
  huntedMarker: { backgroundColor: color.accent800, borderWidth: 1, borderColor: color.accent },
  huntStatsRow: { gap: 4 },
  huntLead: { fontFamily: font.heading, fontSize: 24, color: color.text },
  huntLeadSuffix: { fontSize: 13, color: 'rgba(233,233,237,0.65)', fontFamily: font.body },
  huntNote: { fontSize: 12.5, color: 'rgba(233,233,237,0.55)' },
  raceCard: { padding: 16, gap: 10 },
  raceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  raceTitle: { fontFamily: font.heading, fontSize: 16, color: color.text, flex: 1 },
  raceMeta: { fontSize: 12, color: 'rgba(233,233,237,0.55)' },
  raceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  raceRank: { width: 14, fontSize: 12, color: 'rgba(233,233,237,0.55)' },
  raceName: { fontSize: 13.5, color: color.text, width: 62 },
  raceSteps: { fontSize: 12.5, color: color.text, width: 56, textAlign: 'right' },
});
