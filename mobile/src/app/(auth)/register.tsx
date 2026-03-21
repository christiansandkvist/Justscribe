import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading } = useAuthStore();

  async function handleRegister() {
    if (!email || !password) {
      Alert.alert('Fel', 'Ange e-post och lösenord.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Fel', 'Lösenorden matchar inte.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Fel', 'Lösenordet måste vara minst 8 tecken.');
      return;
    }
    try {
      await signUp(email.trim().toLowerCase(), password);
      Alert.alert(
        'Kontot skapat!',
        'Kontrollera din e-post för att verifiera ditt konto.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      Alert.alert('Registrering misslyckades', err.message ?? 'Försök igen.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Skapa konto</Text>

        <TextInput
          style={styles.input}
          placeholder="E-post"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={Colors.secondary}
        />
        <TextInput
          style={styles.input}
          placeholder="Lösenord (min. 8 tecken)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={Colors.secondary}
        />
        <TextInput
          style={styles.input}
          placeholder="Bekräfta lösenord"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholderTextColor={Colors.secondary}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{loading ? 'Skapar konto...' : 'Skapa konto'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.link}>
          <Text style={styles.linkText}>Har du redan ett konto? Logga in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
    backgroundColor: Colors.surface,
  },
  button: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    alignItems: 'center',
    padding: Spacing.sm,
  },
  linkText: {
    ...Typography.bodySmall,
    color: Colors.accent,
    fontWeight: '600',
  },
});
