/**
 * Signup flow:
 * 1. User enters a desired MQTT username + password.
 * 2. We first authenticate against the local server with stored admin credentials
 *    to obtain a JWT (if we don't already have a valid one).
 * 3. We then POST to HiveMQ Cloud to create MQTT credentials for the new user.
 */
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { hivemqApi } from '../api/hivemq';
import { extractErrorMessage } from '../api/client';
import { tokenManager } from '../utils/tokenManager';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingOverlay from '../components/LoadingOverlay';
import { useFormField, rules } from '../hooks/useFormField';
import { colors, typography, spacing } from '../theme';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const { login, getAdminCredentials } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Creating account…');

  const username = useFormField();
  const password = useFormField();
  const confirmPassword = useFormField();
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSignup = async () => {
    const ok =
      username.validate([rules.required('Username'), rules.minLength(3), rules.noSpaces]) &&
      password.validate([rules.required('Password'), rules.minLength(6)]) &&
      confirmPassword.validate([
        rules.required('Confirm password'),
        (v) => (v !== password.value ? 'Passwords do not match' : null),
      ]);

    if (!ok) return;

    setLoading(true);
    try {
      // Ensure we have a valid token before calling the HiveMQ API
      const existingToken = await tokenManager.get();
      if (!existingToken || tokenManager.isExpired(existingToken)) {
        setLoadingMsg('Authenticating…');
        const { username: adminUser, password: adminPass } = await getAdminCredentials();
        await login(adminUser, adminPass);
      }

      setLoadingMsg('Creating MQTT credentials…');
      await hivemqApi.createMqttCredentials({
        username: username.value.trim(),
        password: password.value,
      });

      Alert.alert(
        'Account created',
        `MQTT credentials for "${username.value.trim()}" were created successfully.`,
        [{ text: 'Sign in', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      Alert.alert('Signup failed', extractErrorMessage(err));
    } finally {
      setLoading(false);
      setLoadingMsg('Creating account…');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Set up your MQTT credentials</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Username"
            placeholder="Choose a username"
            value={username.value}
            onChangeText={username.onChange}
            error={username.error}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Input
            ref={passwordRef}
            label="Password"
            placeholder="Choose a password"
            value={password.value}
            onChangeText={password.onChange}
            error={password.error}
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />

          <Input
            ref={confirmRef}
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword.value}
            onChangeText={confirmPassword.onChange}
            error={confirmPassword.error}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignup}
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message={loadingMsg} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg },
  button: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: { ...typography.body, color: colors.textSecondary },
  link: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
