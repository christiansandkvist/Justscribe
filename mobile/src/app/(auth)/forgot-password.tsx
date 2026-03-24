import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useAuthStore();
  const { t } = useLanguageStore();

  async function handleReset() {
    if (!email.trim()) { Alert.alert(t.auth.missingFields, t.auth.missingFieldsMsg); return; }
    try {
      await resetPassword(email.trim().toLowerCase());
      Alert.alert(t.auth.resetSent, t.auth.resetSentMsg, [{ text: t.auth.ok, onPress: () => router.replace('/(auth)/login') }]);
    } catch (err: any) { Alert.alert(t.auth.loginFailed, err.message ?? 'Please try again.'); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.auth.resetTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.resetSubtitle}</Text>
        </View>
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder={t.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor={Colors.secondary} returnKeyType="done" onSubmitEditing={handleReset} />
          <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{loading ? t.auth.sending : t.auth.sendReset}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>{t.auth.backToLogin}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 80, paddingBottom: Spacing.xl, justifyContent: 'center', gap: Spacing.lg },
  header: { alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.secondary, textAlign: 'center' },
  form: { gap: Spacing.sm },
  input: { height: 52, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: 16, color: Colors.primary, backgroundColor: Colors.surface },
  btnPrimary: { height: 52, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs },
  btnPrimaryText: { color: Colors.onPrimary, fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.45 },
  backBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  backText: { fontSize: 14, color: Colors.accent, fontWeight: '500' },
});
