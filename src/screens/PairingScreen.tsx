import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ID } from '../api/appwrite';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Button from '../components/Button';
import DeviceListItem from '../components/DeviceListItem';
import Input from '../components/Input';
import SectionCard from '../components/SectionCard';
import useBle from '../hooks/useBle';
import { colors, spacing, typography, radius } from '../theme';
import { type ProvisionCredentials } from '../types/ble';
import { type DeviceType, DEVICE_TYPE_META } from '../types/device';
import { devicesApi } from '../api/appwrite';
import { mqttTopics } from '../utils/mqttTopics';

interface PairingScreenProps {
  visible: boolean;
  onClose: () => void;
  /** Called after a device is successfully registered in Appwrite */
  onPairingComplete: () => void;
  /** Appwrite user.$id of the logged-in user; empty string when DEV_BYPASS_AUTH is on */
  userId: string;
}

const BASE_CREDS: Omit<ProvisionCredentials, 'id' | 'base_topic'> = {
  ssid: '',
  pass: '',
  host: '',
  u: '',
  p: '',
};

const DEVICE_TYPES = Object.entries(DEVICE_TYPE_META) as [DeviceType, { label: string; icon: string }][];

export default function PairingScreen({
  visible,
  onClose,
  onPairingComplete,
  userId,
}: PairingScreenProps) {
  const { step, devices, selectedDevice, error, startScan, stopScan, selectDevice, provision, reset } =
    useBle();

  const [creds, setCreds] = useState(BASE_CREDS);
  const [deviceName, setDeviceName] = useState('');
  const [deviceNameError, setDeviceNameError] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('camera');
  const [saving, setSaving] = useState(false);

  const setField = (key: keyof typeof BASE_CREDS) => (value: string) =>
    setCreds((prev) => ({ ...prev, [key]: value }));

  const canSubmit =
    deviceName.trim().length > 0 &&
    creds.ssid.trim() &&
    creds.pass.trim() &&
    creds.host.trim() &&
    creds.u.trim() &&
    creds.p.trim();

  const handleProvision = () => {
    if (!deviceName.trim()) {
      setDeviceNameError('Device name is required');
      return;
    }
    setDeviceNameError('');

    const deviceId = ID.unique();
    const base_topic = mqttTopics.base(userId || 'dev', deviceId);
    provision({ ...creds, id: deviceId, base_topic });
  };

  const handleDone = async () => {
    if (!userId) {
      // DEV_BYPASS_AUTH — skip Appwrite save
      Alert.alert('Device paired!', `${deviceName || 'Device'} credentials sent successfully.`, [
        { text: 'OK', onPress: () => { handleReset(); onPairingComplete(); onClose(); } },
      ]);
      return;
    }

    setSaving(true);
    try {
      const deviceId = ID.unique();
      const mqttBaseTopic = mqttTopics.base(userId, deviceId);
      await devicesApi.create(userId, {
        deviceId,
        name: deviceName.trim(),
        type: deviceType,
        mqttBaseTopic,
        isOnline: false,
        lastSeen: new Date().toISOString(),
        firmwareVersion: '',
        metadata: '{}',
      });

      Alert.alert(
        'Device added!',
        `${deviceName.trim()} has been paired and registered successfully.`,
        [{
          text: 'OK',
          onPress: () => {
            handleReset();
            onPairingComplete();
            onClose();
          },
        }],
      );
    } catch {
      Alert.alert('Save failed', 'Device was paired but could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    reset();
    setCreds(BASE_CREDS);
    setDeviceName('');
    setDeviceNameError('');
    setDeviceType('camera');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Modal header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pair New Device</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ── IDLE / SCANNING ── */}
            {(step === 'idle' || step === 'scanning') && (
              <>
                <SectionCard title="Bluetooth Scan">
                  {step === 'scanning' ? (
                    <View style={styles.scanningRow}>
                      <ActivityIndicator color={colors.primary} />
                      <Text style={styles.scanningText}>Scanning for devices…</Text>
                      <Button title="Stop" onPress={stopScan} variant="ghost" style={styles.stopBtn} />
                    </View>
                  ) : (
                    <Button title="Scan for ESP32 Devices" onPress={startScan} />
                  )}
                </SectionCard>

                {devices.length > 0 && (
                  <SectionCard title={`Found Devices (${devices.length})`}>
                    {devices.map((device, i) => (
                      <React.Fragment key={device.id}>
                        {i > 0 && <View style={styles.divider} />}
                        <DeviceListItem device={device} onPress={selectDevice} />
                      </React.Fragment>
                    ))}
                  </SectionCard>
                )}

                {step === 'idle' && devices.length === 0 && (
                  <View style={styles.hint}>
                    <Text style={styles.hintText}>
                      Make sure your ESP32 has no saved credentials and is advertising as "ESP32_Config".
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* ── CONNECTING ── */}
            {step === 'connecting' && (
              <SectionCard>
                <View style={styles.centeredState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.stateLabel}>Connecting to {selectedDevice?.name}…</Text>
                </View>
              </SectionCard>
            )}

            {/* ── CREDENTIAL FORM ── */}
            {(step === 'form' || step === 'provisioning') && (
              <>
                <ConnectedBadge name={selectedDevice?.name ?? ''} />

                {/* Device identity */}
                <SectionCard title="Device Info">
                  <Input
                    label="Device Name"
                    placeholder="e.g. Living Room Camera"
                    value={deviceName}
                    onChangeText={(v) => { setDeviceName(v); setDeviceNameError(''); }}
                    error={deviceNameError}
                    returnKeyType="next"
                  />
                  <Text style={styles.typeLabel}>Device Type</Text>
                  <View style={styles.typeRow}>
                    {DEVICE_TYPES.map(([value, meta]) => (
                      <Pressable
                        key={value}
                        style={[styles.typeBtn, deviceType === value && styles.typeBtnActive]}
                        onPress={() => setDeviceType(value)}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={20}
                          color={deviceType === value ? colors.white : colors.primary}
                        />
                        <Text style={[styles.typeBtnText, deviceType === value && styles.typeBtnTextActive]}>
                          {meta.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </SectionCard>

                {/* WiFi */}
                <SectionCard title="WiFi Credentials">
                  <Input
                    label="SSID"
                    placeholder="Your WiFi network name"
                    value={creds.ssid}
                    onChangeText={setField('ssid')}
                  />
                  <Input
                    label="Password"
                    placeholder="WiFi password"
                    value={creds.pass}
                    onChangeText={setField('pass')}
                    secureTextEntry
                  />
                </SectionCard>

                {/* MQTT */}
                <SectionCard title="MQTT Credentials">
                  <Input
                    label="Host"
                    placeholder="e.g. xxxx.s1.eu.hivemq.cloud"
                    value={creds.host}
                    onChangeText={setField('host')}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <Input
                    label="Username"
                    placeholder="MQTT username"
                    value={creds.u}
                    onChangeText={setField('u')}
                  />
                  <Input
                    label="Password"
                    placeholder="MQTT password"
                    value={creds.p}
                    onChangeText={setField('p')}
                    secureTextEntry
                  />
                </SectionCard>

                <View style={styles.actions}>
                  <Button
                    title="Send to Device"
                    onPress={handleProvision}
                    loading={step === 'provisioning'}
                    disabled={!canSubmit || step === 'provisioning'}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Cancel"
                    onPress={handleReset}
                    variant="ghost"
                    disabled={step === 'provisioning'}
                    style={styles.actionBtn}
                  />
                </View>
              </>
            )}

            {/* ── DONE ── */}
            {step === 'done' && (
              <SectionCard>
                <View style={styles.centeredState}>
                  <Ionicons name="checkmark-circle" size={56} color={colors.success} />
                  <Text style={styles.stateLabel}>Credentials sent!</Text>
                  <Text style={styles.stateSubLabel}>
                    The ESP32 will restart and connect to your WiFi + MQTT broker automatically.
                  </Text>
                  <Button
                    title={saving ? 'Saving…' : 'Add to My Devices'}
                    onPress={handleDone}
                    loading={saving}
                    style={styles.doneBtn}
                  />
                  <Button
                    title="Pair Another Device"
                    onPress={handleReset}
                    variant="ghost"
                    style={styles.doneBtn}
                    disabled={saving}
                  />
                </View>
              </SectionCard>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* BLE initialising overlay */}
        <Modal visible={step === 'preparing'} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.overlayBackdrop}>
            <View style={styles.overlayCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.overlayTitle}>Enabling Bluetooth…</Text>
              <Text style={styles.overlaySubtitle}>Waiting for the radio to be ready</Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

function ConnectedBadge({ name }: { name: string }) {
  return (
    <View style={styles.connectedBadge}>
      <View style={styles.connectedDot} />
      <Text style={styles.connectedText}>Connected to {name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.h2, color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  errorBanner: {
    backgroundColor: '#fce8e6',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: { ...typography.caption, color: colors.error },
  scanningRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scanningText: { ...typography.body, color: colors.text, flex: 1 },
  stopBtn: { height: 36, paddingHorizontal: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  hint: { alignItems: 'center', paddingVertical: spacing.lg },
  hintText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  centeredState: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.md },
  stateLabel: { ...typography.body, color: colors.text, fontWeight: '600', textAlign: 'center' },
  stateSubLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  doneBtn: { alignSelf: 'stretch', marginTop: spacing.xs },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  connectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  connectedText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  // Device type selector
  typeLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  typeBtnActive: { backgroundColor: colors.primary },
  typeBtnText: { ...typography.label, color: colors.primary },
  typeBtnTextActive: { color: colors.white },
  actions: { gap: spacing.sm },
  actionBtn: {},
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    width: '75%',
  },
  overlayTitle: { ...typography.body, color: colors.text, fontWeight: '600' },
  overlaySubtitle: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
