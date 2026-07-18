import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography, radius } from '../theme';

export default function ProfileScreen() {
  const { appwriteUser, username, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } catch {
            setLoggingOut(false);
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const displayName = appwriteUser?.name || username || 'Unknown';
  const email = appwriteUser?.email ?? '—';
  const userId = appwriteUser?.$id ?? '—';
  const memberSince = appwriteUser?.$createdAt
    ? new Date(appwriteUser.$createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.emailLabel}>{email}</Text>
        </View>

        {/* Details card */}
        <View style={styles.card}>
          <InfoRow icon="person-outline" label="Name" value={displayName} />
          <Divider />
          <InfoRow icon="mail-outline" label="Email" value={email} />
          <Divider />
          <InfoRow icon="calendar-outline" label="Member since" value={memberSince} />
          <Divider />
          <InfoRow icon="key-outline" label="User ID" value={userId} mono />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}

function InfoRow({ icon, label, value, mono = false }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={18} color={colors.primary} style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, mono && styles.infoValueMono]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  // Avatar section
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  displayName: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  emailLabel: { ...typography.body, color: colors.textSecondary },

  // Details card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: { width: 20 },
  infoLabel: { ...typography.label, color: colors.textSecondary },
  infoValue: { ...typography.body, color: colors.text, flexShrink: 1, textAlign: 'right' },
  infoValueMono: { fontSize: 12, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border },

  // Logout button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: 'transparent',
  },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText: { ...typography.button, color: colors.error },
});
