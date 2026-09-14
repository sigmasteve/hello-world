import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AndroidLogoIcon, AppleLogoIcon, HourglassIcon, UserPlusIcon } from 'phosphor-react-native';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { text } from '../theme/text';
import { color, font } from '../theme/tokens';
import { FRIENDS } from '../data/sampleData';

export function FriendsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={text.h2}>Friends</Text>

      <Card style={styles.inviteCard} elevated={false}>
        <UserPlusIcon size={17} color={color.accent300} />
        <Text style={styles.inviteText}>Send one link. It works on iPhone and Android.</Text>
        <Text style={styles.inviteLink}>hound.app/u/jordan</Text>
        <Button label="Copy" variant="primary" small />
      </Card>

      {FRIENDS.map((f) => (
        <Card key={f.name} style={styles.friendRow} elevated={false}>
          <Avatar initials={f.initials} tint={f.tint} />
          <View style={{ flex: 1, gap: 2, minWidth: 120 }}>
            <Text style={styles.friendName}>{f.name}</Text>
            <Text style={styles.friendSub}>{f.sub}</Text>
          </View>
          <View style={styles.platformBadge}>
            {f.platform === 'Apple Health' ? (
              <AppleLogoIcon size={12} color={color.neutral200} weight="fill" />
            ) : (
              <AndroidLogoIcon size={12} color={color.neutral200} />
            )}
            <Text style={styles.platformText}>{f.platform}</Text>
          </View>
          <View style={styles.syncRow}>
            <View style={[styles.dot, { backgroundColor: f.syncColor }]} />
            <Text style={[styles.syncText, { color: f.syncColor }]}>{f.sync}</Text>
          </View>
          <Button label="Challenge" small />
        </Card>
      ))}

      <Text style={styles.pendingLabel}>Pending</Text>
      <Card style={styles.pendingRow} elevated={false}>
        <View style={styles.pendingAvatar}>
          <HourglassIcon size={15} color={color.neutral500} />
        </View>
        <Text style={styles.pendingEmail}>kate.n@gmail.com</Text>
        <Text style={styles.pendingMeta}>Invited 3 days ago</Text>
        <Button label="Resend" variant="ghost" small />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  inviteCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2a2540', flexWrap: 'wrap' },
  inviteText: { flex: 1, minWidth: 150, fontSize: 13.5, color: color.text },
  inviteLink: { fontFamily: font.body, fontSize: 12.5, color: 'rgba(233,233,237,0.7)' },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  friendName: { fontSize: 14.5, color: color.text },
  friendSub: { fontSize: 12, color: 'rgba(233,233,237,0.55)' },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: color.neutral800,
  },
  platformText: { fontSize: 10.5, color: color.neutral200 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  syncText: { fontSize: 11.5 },
  pendingLabel: { fontSize: 15, color: 'rgba(233,233,237,0.7)', marginTop: 6 },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(35,37,50,0.6)',
    flexWrap: 'wrap',
  },
  pendingAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.neutral600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingEmail: { flex: 1, fontSize: 14, color: color.text, minWidth: 120 },
  pendingMeta: { fontSize: 12, color: 'rgba(233,233,237,0.55)' },
});
