import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

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
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t.auth.resetTitle}</Text>
          <Text style={s.subtitle}>{t.auth.resetSubtitle}</Text>
        </View>
        <View style={s.form}>
          <TextInput style={s.input} placeholder={t.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor="rgba(255,255,255,0.35)" returnKeyType="done" onSubmitEditing={handleReset} />
          <TouchableOpacity style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>{loading ? t.auth.sending : t.auth.sendReset}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backText}>{t.auth.backToLogin}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0d0d1a' },
  scroll:         { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 24, justifyContent: 'center', gap: 24 },
  header:         { alignItems: 'center', gap: 8, marginBottom: 16 },
  title:          { fontSize: 28, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  subtitle:       { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  form:           { gap: 8 },
  input:          { height: 52, borderWidth: 1.5, borderColor: 'rgba(100,180,255,0.12)', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#ffffff', backgroundColor: '#131328' },
  btnPrimary:     { height: 52, backgroundColor: '#64b4ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnPrimaryText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  btnDisabled:    { opacity: 0.45 },
  backBtn:        { alignItems: 'center', paddingVertical: 8 },
  backText:       { fontSize: 14, color: '#64b4ff', fontWeight: '500' },
});
