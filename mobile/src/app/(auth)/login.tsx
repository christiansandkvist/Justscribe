import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

const C = {
  bg:        '#0d0d1a',
  surface:   '#131328',
  border:    'rgba(100,180,255,0.12)',
  white:     '#ffffff',
  white70:   'rgba(255,255,255,0.70)',
  white35:   'rgba(255,255,255,0.35)',
  white08:   'rgba(255,255,255,0.08)',
  white05:   'rgba(255,255,255,0.05)',
  cyan:      '#64b4ff',
  purple:    '#a78bfa',
};

function WaveformIcon({ size = 28 }: { size?: number }) {
  const bars = [0.45, 0.75, 1, 0.75, 0.45];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: size }}>
      {bars.map((ratio, i) => (
        <LinearGradient
          key={i}
          colors={[C.cyan, C.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: 3, height: size * ratio, borderRadius: 2, opacity: 0.85 }}
        />
      ))}
    </View>
  );
}

function GoogleIcon() {
  return (
    <View style={g.container}>
      <Text style={g.text}>G</Text>
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signInWithGoogle, loading } = useAuthStore();
  const { t } = useLanguageStore();

  async function handleLogin() {
    if (!email.trim() || !password) { Alert.alert(t.auth.missingFields, t.auth.missingFieldsMsg); return; }
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(app)/home');
    } catch (err: any) { Alert.alert(t.auth.loginFailed, err.message ?? 'Please try again.'); }
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
          <View style={s.logoRow}>
            <WaveformIcon size={28} />
            <Text style={s.wordmark}>Vocri</Text>
          </View>
          <Text style={s.tagline}>{t.auth.loginTagline}</Text>
        </View>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder={t.auth.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={C.white35}
            returnKeyType="next"
          />
          <TextInput
            style={s.input}
            placeholder={t.auth.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={C.white35}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity style={[s.btnPrimary, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={[C.cyan, C.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <Text style={s.btnPrimaryText}>{loading ? t.auth.loggingIn : t.auth.login}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={s.forgotText}>{t.auth.forgotPassword}</Text>
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

        <TouchableOpacity style={s.footer} onPress={() => router.push('/(auth)/register')}>
          <Text style={s.footerText}>{t.auth.noAccount} <Text style={s.footerLink}>{t.auth.register}</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const g = StyleSheet.create({
  container: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  text: { fontSize: 13, fontWeight: '700', color: '#4285F4', lineHeight: 17 },
});

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0d0d1a' },
  scroll:         { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 24, justifyContent: 'center', gap: 20 },
  header:         { alignItems: 'center', gap: 8, marginBottom: 8 },
  logoRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  wordmark:       { fontSize: 36, fontWeight: '600', color: '#ffffff', letterSpacing: -1 },
  tagline:        { fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: '400', textAlign: 'center' },
  form:           { gap: 12 },
  input:          { height: 52, borderWidth: 1, borderColor: 'rgba(100,180,255,0.12)', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#ffffff', backgroundColor: '#131328' },
  btnPrimary:     { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4, overflow: 'hidden' },
  btnPrimaryText: { color: '#ffffff', fontSize: 16, fontWeight: '600', zIndex: 1 },
  btnDisabled:    { opacity: 0.45 },
  forgotBtn:      { alignItems: 'center', paddingVertical: 6 },
  forgotText:     { fontSize: 14, color: '#64b4ff', fontWeight: '500' },
  divider:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine:    { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText:    { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  btnGoogle:      { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#ffffff' },
  btnGoogleText:  { fontSize: 16, fontWeight: '600', color: '#0d0d1a' },
  footer:         { alignItems: 'center', paddingVertical: 8 },
  footerText:     { fontSize: 14, color: 'rgba(255,255,255,0.35)' },
  footerLink:     { color: '#a78bfa', fontWeight: '600' },
});
