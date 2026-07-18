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
import { extractErrorMessage } from '../api/client';
import Input from '../components/Input';
import Button from '../components/Button';
import LoadingOverlay from '../components/LoadingOverlay';
import { useFormField, rules } from '../hooks/useFormField';
import { colors, typography, spacing } from '../theme';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Creating account…');

  const displayName = useFormField();
  const email = useFormField();
  const password = useFormField();
  const confirmPassword = useFormField();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleSignup = async () => {
    const ok =
      displayName.validate([rules.required('Display name'), rules.minLength(2)]) &&
      email.validate([rules.required('Email'), rules.noSpaces]) &&
      password.validate([rules.required('Password'), rules.minLength(6)]) &&
      confirmPassword.validate([
        rules.required('Confirm password'),
        (v) => (v !== password.value ? 'Passwords do not match' : null),
      ]);

    if (!ok) return;

    setLoading(true);
    try {
      setLoadingMsg('Creating account…');
      await signup(email.value.trim(), password.value, displayName.value.trim());

      Alert.alert(
        'Account created',
        'Your account has been created successfully.',
        [{ text: 'Sign in', onPress: () => navigation.navigate('Login') }],
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
          <Text style={styles.subtitle}>Get started with PLD Mapp</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Display Name"
            placeholder="Your name"
            value={displayName.value}
            onChangeText={displayName.onChange}
            error={displayName.error}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <Input
            ref={emailRef}
            label="Email"
            placeholder="you@example.com"
            value={email.value}
            onChangeText={email.onChange}
            error={email.error}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Input
            ref={passwordRef}
            label="Password"
            placeholder="Choose a password (min 6 chars)"
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
