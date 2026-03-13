import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { BleDevice } from '../types/ble';

interface DeviceListItemProps {
  device: BleDevice;
  onPress: (device: BleDevice) => void;
  disabled?: boolean;
}

function rssiLabel(rssi: number | null): string {
  if (rssi === null) return '–';
  if (rssi >= -60) return 'Strong';
  if (rssi >= -75) return 'Good';
  if (rssi >= -90) return 'Weak';
  return 'Poor';
}

function rssiColor(rssi: number | null): string {
  if (rssi === null) return colors.placeholder;
  if (rssi >= -60) return colors.success;
  if (rssi >= -75) return '#f59e0b'; // amber
  return colors.error;
}

export default function DeviceListItem({ device, onPress, disabled = false }: DeviceListItemProps) {
  return (
    <Pressable
      onPress={() => onPress(device)}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>📡</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{device.name}</Text>
        <Text style={styles.id} numberOfLines={1}>{device.id}</Text>
      </View>
      <View style={styles.signal}>
        <Text style={[styles.signalLabel, { color: rssiColor(device.rssi) }]}>
          {rssiLabel(device.rssi)}
        </Text>
        {device.rssi !== null && (
          <Text style={styles.rssiValue}>{device.rssi} dBm</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  pressed: { backgroundColor: colors.background },
  disabled: { opacity: 0.5 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconText: { fontSize: 20 },
  info: { flex: 1 },
  name: { ...typography.label, color: colors.text },
  id: { ...typography.caption, color: colors.placeholder, marginTop: 2 },
  signal: { alignItems: 'flex-end' },
  signalLabel: { ...typography.caption, fontWeight: '600' },
  rssiValue: { ...typography.caption, color: colors.placeholder, marginTop: 2 },
});
