import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../context/AuthContext';
import { devicesApi } from '../api/appwrite';
import { type Device, DEVICE_TYPE_META } from '../types/device';
import { colors, spacing, typography, radius } from '../theme';
import PairingScreen from './PairingScreen';

export default function DeviceListScreen() {
  const { appwriteUser } = useAuth();
  const userId = appwriteUser?.$id ?? '';

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pairingVisible, setPairingVisible] = useState(false);

  const fetchDevices = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const list = await devicesApi.list(userId);
      setDevices(list);
    } catch {
      // Keep existing list on error; user can pull-to-refresh
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // Re-fetch when the tab comes back into focus (e.g. returning from elsewhere)
  useFocusEffect(useCallback(() => { fetchDevices(); }, [fetchDevices]));

  const handleDelete = (device: Device) => {
    Alert.alert(
      'Remove device',
      `Remove "${device.name}" from your account? This does not affect the physical device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await devicesApi.delete(device.$id);
              setDevices((prev) => prev.filter((d) => d.$id !== device.$id));
            } catch {
              Alert.alert('Error', 'Could not remove device. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleLongPress = (device: Device) => {
    Alert.alert(device.name, undefined, [
      { text: 'Remove', style: 'destructive', onPress: () => handleDelete(device) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons name="log-in-outline" size={48} color={colors.placeholder} />
          <Text style={styles.emptyTitle}>Not signed in</Text>
          <Text style={styles.emptySubtitle}>Sign in to manage your devices</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Devices</Text>
        <Text style={styles.headerSubtitle}>
          {devices.length > 0 ? `${devices.length} device${devices.length !== 1 ? 's' : ''}` : 'No devices yet'}
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.$id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDevices(true)}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <DeviceCard
              device={item}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          ListEmptyComponent={<EmptyState />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setPairingVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Pairing modal */}
      <PairingScreen
        visible={pairingVisible}
        onClose={() => setPairingVisible(false)}
        onPairingComplete={() => fetchDevices()}
        userId={userId}
      />
    </SafeAreaView>
  );
}

// ── Device Card ───────────────────────────────────────────────────────────────

interface DeviceCardProps {
  device: Device;
  onLongPress: () => void;
}

function DeviceCard({ device, onLongPress }: DeviceCardProps) {
  const meta = DEVICE_TYPE_META[device.type];
  const lastSeenLabel = formatLastSeen(device.lastSeen);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <Ionicons name={meta.icon} size={26} color={colors.primary} />
        </View>
        <View style={[styles.statusDot, device.isOnline ? styles.dotOnline : styles.dotOffline]} />
      </View>

      <Text style={styles.cardName} numberOfLines={2}>{device.name}</Text>
      <Text style={styles.cardType}>{meta.label}</Text>
      <Text style={styles.cardLastSeen} numberOfLines={1}>{lastSeenLabel}</Text>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="hardware-chip-outline" size={56} color={colors.placeholder} />
      <Text style={styles.emptyTitle}>No devices yet</Text>
      <Text style={styles.emptySubtitle}>Tap the + button to pair your first device</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLastSeen(iso: string): string {
  if (!iso) return 'Never seen';
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return 'Never seen';
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_GAP = spacing.sm;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h2, color: colors.text },
  headerSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  listContent: {
    padding: spacing.md,
    paddingBottom: 96, // room for FAB
    flexGrow: 1,
  },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 152,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // Android
    elevation: 2,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  dotOnline: { backgroundColor: colors.success },
  dotOffline: { backgroundColor: colors.placeholder },
  cardName: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: 2 },
  cardType: { ...typography.caption, color: colors.primary, fontWeight: '500', marginBottom: spacing.xs },
  cardLastSeen: { ...typography.caption, color: colors.textSecondary },
  // Empty state
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, flex: 1 },
  emptyTitle: { ...typography.body, color: colors.text, fontWeight: '600', marginTop: spacing.md },
  emptySubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
