import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>
            <Text style={styles.wBold}>S</Text><Text style={styles.wLight}>cribe</Text>
            <Text style={styles.wBold}>T</Text><Text style={styles.wLight}>o</Text>
            <Text style={styles.wBold}>G</Text><Text style={styles.wLight}>o</Text>
            <Text style={styles.wSmall}>.com</Text>
          </Text>
          <Text style={styles.tagline}>{t.auth.loginTagline}</Text>
        </View>
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder={t.auth.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor={Colors.secondary} returnKeyType="next" />
          <TextInput style={styles.input} placeholder={t.auth.password} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={Colors.secondary} returnKeyType="done" onSubmitEditing={handleLogin} />
          <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{loading ? t.auth.loggingIn : t.auth.login}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>{t.auth.forgotPassword}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t.auth.orDivider}</Text>
          <View style={styles.dividerLine} />
        </View>
        <TouchableOpacity style={[styles.btnGoogle, loading && styles.btnDisabled]} onPress={handleGoogle} disabled={loading} activeOpacity={0.85}>
          <GoogleIcon />
          <Text style={styles.btnGoogleText}>{t.auth.continueGoogle}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footer} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.footerText}>{t.auth.noAccount} <Text style={styles.footerLink}>{t.auth.register}</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GoogleIcon() {
  return (
    <View style={gStyles.container}><Text style={gStyles.g}>G</Text></View>
  );
}

const gStyles = StyleSheet.create({
  container: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm, borderWidth: 1, borderColor: '#E5E5E5' },
  g: { fontSize: 13, fontWeight: '700', color: '#4285F4', lineHeight: 17 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 80, paddingBottom: Spacing.xl, justifyContent: 'center', gap: Spacing.lg },
  header: { alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  wordmark: { fontSize: 40, color: Colors.accent, letterSpacing: -0.5 },
  wBold: { fontWeight: '800' },
  wLight: { fontWeight: '300' },
  wSmall: { fontSize: 24, fontWeight: '300' },
  tagline: { fontSize: 15, color: Colors.secondary, fontWeight: '400' },
  form: { gap: Spacing.sm },
  input: { height: 52, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, fontSize: 16, color: Colors.primary, backgroundColor: Colors.surface },
  btnPrimary: { height: 52, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs },
  btnPrimaryText: { color: Colors.onPrimary, fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.45 },
  forgotBtn: { alignItems: 'center', paddingVertical: Spacing.xs },
  forgotText: { fontSize: 14, color: Colors.accent, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.secondary },
  btnGoogle: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  btnGoogleText: { fontSize: 16, fontWeight: '600', color: Colors.onPrimary },
  footer: { alignItems: 'center', paddingVertical: Spacing.sm },
  footerText: { fontSize: 14, color: Colors.secondary },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});
