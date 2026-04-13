import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import mqtt, { MqttClient } from 'mqtt';
import { HIVEMQ_ADMIN_DEFAULTS, HIVEMQ_WS_URL } from '../constants/config';
import { colors, spacing, typography } from '../theme';
import CamViewer from '../components/CamViewer';

const ESPCAM_TOPIC = 'espcam/capture';

interface ReceivedMessage {
  topic: string;
  payload: string;
  timestamp: string;
}

export default function HomeScreen() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ReceivedMessage[]>([]);
  const [pubTopic, setPubTopic] = useState('');
  const [pubMessage, setPubMessage] = useState('');

  const clientRef = useRef<MqttClient | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Tracks whether the user manually disconnected (suppresses auto-reconnect label)
  const manualDisconnect = useRef(false);

  const connectMqtt = useCallback(() => {
    // Clean up any existing client
    clientRef.current?.end(true);

    manualDisconnect.current = false;
    console.log('Connecting to MQTT broker…', HIVEMQ_ADMIN_DEFAULTS);

    const client = mqtt.connect(HIVEMQ_WS_URL, {
      username: HIVEMQ_ADMIN_DEFAULTS.USERNAME,
      password: HIVEMQ_ADMIN_DEFAULTS.PASSWORD,
      clean: true,
      reconnectPeriod: 3000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      setConnected(true);
      client.subscribe('#', { qos: 1 });
    });

    client.on('disconnect', () => {
      if (!manualDisconnect.current) setConnected(false);
    });
    client.on('offline', () => {
      if (!manualDisconnect.current) setConnected(false);
    });
    client.on('error', () => {
      if (!manualDisconnect.current) setConnected(false);
    });

    client.on('message', (topic, payload) => {
      const entry: ReceivedMessage = {
        topic,
        payload: payload.toString(),
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev.slice(-199), entry]);
    });
  }, []);

  const disconnectMqtt = useCallback(() => {
    manualDisconnect.current = true;
    clientRef.current?.end(true);
    clientRef.current = null;
    setConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connectMqtt();
    return () => {
      manualDisconnect.current = true;
      clientRef.current?.end(true);
    };
  }, [connectMqtt]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = useCallback(() => {
    const topic = pubTopic.trim();
    const message = pubMessage.trim();
    if (!topic || !message || !clientRef.current?.connected) return;
    clientRef.current.publish(topic, message, { qos: 1 });
    setPubMessage('');
  }, [pubTopic, pubMessage]);

  const isDisconnected = !connected && manualDisconnect.current;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AMPERE</Text>
          <View style={styles.headerRight}>
            <View style={styles.statusRow}>
              <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
              <Text style={[styles.statusText, connected ? styles.statusOn : styles.statusOff]}>
                {connected ? 'Connected' : isDisconnected ? 'Disconnected' : 'Connecting…'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.connBtn, isDisconnected ? styles.connBtnReconnect : styles.connBtnDisconnect]}
              onPress={isDisconnected ? connectMqtt : disconnectMqtt}
            >
              <Text style={styles.connBtnText}>
                {isDisconnected ? 'Reconnect' : 'Disconnect'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Received messages */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Received Messages</Text>
          <ScrollView
            ref={scrollRef}
            style={styles.messageBox}
            contentContainerStyle={styles.messageBoxContent}
          >
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>Waiting for messages…</Text>
            ) : (
              messages.map((m, i) => (
                <View key={i} style={styles.messageRow}>
                  <Text style={styles.messageMeta}>{m.timestamp} · {m.topic}</Text>
                  {m.topic === ESPCAM_TOPIC ? (
                    <CamViewer base64={m.payload} title="ESP32-CAM" />
                  ) : (
                    <Text style={styles.messagePayload}>{m.payload}</Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Publish form */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Publish</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Topic"
              placeholderTextColor={colors.placeholder}
              value={pubTopic}
              onChangeText={setPubTopic}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[styles.input, styles.inputMessage]}
              placeholder="Message"
              placeholderTextColor={colors.placeholder}
              value={pubMessage}
              onChangeText={setPubMessage}
              multiline
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!connected || !pubTopic.trim() || !pubMessage.trim()) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!connected || !pubTopic.trim() || !pubMessage.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h2, color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: colors.success },
  dotOff: { backgroundColor: colors.placeholder },
  statusText: { ...typography.caption },
  statusOn: { color: colors.success },
  statusOff: { color: colors.placeholder },
  connBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: 6,
  },
  connBtnDisconnect: { backgroundColor: colors.error },
  connBtnReconnect: { backgroundColor: colors.success },
  connBtnText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  messageBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 260,
  },
  messageBoxContent: { padding: spacing.md, flexGrow: 1 },
  emptyText: { ...typography.body, color: colors.placeholder, textAlign: 'center', marginTop: spacing.xl },
  messageRow: { marginBottom: spacing.sm },
  messageMeta: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  messagePayload: { ...typography.body, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputMessage: { height: 72, textAlignVertical: 'top' },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.border },
  sendButtonText: { ...typography.button, color: colors.white },
});
