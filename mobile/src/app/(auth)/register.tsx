import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithGoogle, loading } = useAuthStore();
  const { t } = useLanguageStore();

  async function handleRegister() {
    if (!email.trim() || !password) { Alert.alert(t.auth.missingFields, t.auth.missingFieldsMsg); return; }
    if (password.length < 8) { Alert.alert(t.auth.weakPassword, t.auth.weakPasswordMsg); return; }
    try {
      await signUp(email.trim().toLowerCase(), password);
      Alert.alert(t.auth.checkEmail, t.auth.checkEmailMsg, [{ text: t.auth.ok, onPress: () => router.replace('/(auth)/login') }]);
    } catch (err: any) { Alert.alert(t.auth.registerFailed, err.message ?? 'Please try again.'); }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
      if (Platform.OS !== 'web') router.replace('/(app)/home');
    } catch (err: any) { Alert.alert(t.auth.googleFailed, err.message ?? 'Please try again.'); }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t.auth.registerTitle}</Text>
          <Text style={s.subtitle}>{t.auth.registerSubtitle}</Text>
        </View>
        <View style={s.form}>
          <TextInput style={s.input} placeholder={t.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor="rgba(255,255,255,0.35)" returnKeyType="next" />
          <View style={s.passwordWrapper}>
            <TextInput style={s.passwordInput} placeholder={t.auth.passwordHint} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} placeholderTextColor="rgba(255,255,255,0.35)" returnKeyType="done" onSubmitEditing={handleRegister} />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(v => !v)} activeOpacity={0.7}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>{loading ? t.auth.creatingAccount : t.auth.createAccount}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>{t.auth.orDivider}</Text>
          <View style={s.dividerLine} />
        </View>
        <TouchableOpacity style={[s.btnGoogle, loading && s.btnDisabled]} onPress={handleGoogle} disabled={loading} activeOpacity={0.85}>
          <GoogleIcon />
          <Text style={s.btnGoogleText}>{t.auth.continueGoogle}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.footer} onPress={() => router.replace('/(auth)/login')}>
          <Text style={s.footerText}>{t.auth.alreadyAccount} <Text style={s.footerLink}>{t.auth.logIn}</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GoogleIcon() {
  return (<View style={g.container}><Text style={g.gText}>G</Text></View>);
}

const g = StyleSheet.create({
  container: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  gText:     { fontSize: 13, fontWeight: '700', color: '#4285F4', lineHeight: 17 },
});

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0d0d1a' },
  scroll:         { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 24, justifyContent: 'center', gap: 24 },
  header:         { alignItems: 'center', gap: 8, marginBottom: 16 },
  title:          { fontSize: 30, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  subtitle:       { fontSize: 15, color: 'rgba(255,255,255,0.55)' },
  form:           { gap: 8 },
  input:          { height: 52, borderWidth: 1.5, borderColor: 'rgba(100,180,255,0.12)', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#ffffff', backgroundColor: '#131328' },
  passwordWrapper:{ height: 52, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(100,180,255,0.12)', borderRadius: 12, backgroundColor: '#131328' },
  passwordInput:  { flex: 1, height: '100%', paddingHorizontal: 16, fontSize: 16, color: '#ffffff' },
  eyeBtn:         { paddingHorizontal: 14, height: '100%', alignItems: 'center', justifyContent: 'center' },
  btnPrimary:     { height: 52, backgroundColor: '#64b4ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnPrimaryText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  btnDisabled:    { opacity: 0.45 },
  divider:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: 'rgba(100,180,255,0.12)' },
  dividerText:    { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  btnGoogle:      { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#131328' },
  btnGoogleText:  { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  footer:         { alignItems: 'center', paddingVertical: 8 },
  footerText:     { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
  footerLink:     { color: '#64b4ff', fontWeight: '600' },
});
