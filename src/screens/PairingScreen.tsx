import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Button from '../components/Button';
import DeviceListItem from '../components/DeviceListItem';
import Input from '../components/Input';
import SectionCard from '../components/SectionCard';
import useBle from '../hooks/useBle';
import { colors, spacing, typography } from '../theme';
import { BleDevice, ProvisionCredentials } from '../types/ble';

const EMPTY_CREDS: ProvisionCredentials = { ssid: '', pass: '', host: '', u: '', p: '' };

export default function PairingScreen() {
  const { step, devices, selectedDevice, error, startScan, stopScan, selectDevice, provision, reset } =
    useBle();

  const [creds, setCreds] = useState<ProvisionCredentials>(EMPTY_CREDS);

  const setField = (key: keyof ProvisionCredentials) => (value: string) =>
    setCreds((prev) => ({ ...prev, [key]: value }));

  const handleProvision = () => {
    provision(creds);
  };

  const handleReset = () => {
    reset();
    setCreds(EMPTY_CREDS);
  };

  const canSubmit =
    creds.ssid.trim() &&
    creds.pass.trim() &&
    creds.host.trim() &&
    creds.u.trim() &&
    creds.p.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Device Pairing</Text>
          <Text style={styles.subtitle}>Connect and provision an ESP32 via Bluetooth</Text>
        </View>

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
                  placeholder="HiveMQ username"
                  value={creds.u}
                  onChangeText={setField('u')}
                />
                <Input
                  label="Password"
                  placeholder="HiveMQ password"
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
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.stateLabel}>Credentials sent!</Text>
                <Text style={styles.stateSubLabel}>
                  The ESP32 will restart and connect to your WiFi + MQTT broker automatically.
                </Text>
                <Button title="Pair Another Device" onPress={handleReset} style={styles.resetBtn} />
              </View>
            </SectionCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Small sub-component ──────────────────────────────────────────────────────

function ConnectedBadge({ name }: { name: string }) {
  return (
    <View style={styles.connectedBadge}>
      <View style={styles.connectedDot} />
      <Text style={styles.connectedText}>Connected to {name}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  errorBanner: {
    backgroundColor: '#fce8e6',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: { ...typography.caption, color: colors.error },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scanningText: { ...typography.body, color: colors.text, flex: 1 },
  stopBtn: { height: 36, paddingHorizontal: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  hint: { alignItems: 'center', paddingVertical: spacing.lg },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  centeredState: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.md },
  successIcon: { fontSize: 48 },
  stateLabel: { ...typography.body, color: colors.text, fontWeight: '600', textAlign: 'center' },
  stateSubLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: { marginTop: spacing.sm },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  connectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  connectedText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  actions: { gap: spacing.sm },
  actionBtn: {},
});
