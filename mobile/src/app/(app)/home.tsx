import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Modal, Alert, ScrollView, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useBalance } from '../../hooks/useBalance';
import { usePayment } from '../../hooks/usePayment';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { pickAudioFile, getAudioDuration } from '../../services/fileService';
import { TOP_UP_PACKAGES } from '../../constants/pricing';
import type { TopUpPackage } from '../../types';

const C = {
  bg:        '#0d0d1a',
  surface:   '#131328',
  border:    'rgba(100,180,255,0.12)',
  white:     '#ffffff',
  white70:   'rgba(255,255,255,0.70)',
  white55:   'rgba(255,255,255,0.55)',
  white35:   'rgba(255,255,255,0.35)',
  white25:   'rgba(255,255,255,0.25)',
  white08:   'rgba(255,255,255,0.08)',
  white05:   'rgba(255,255,255,0.05)',
  cyan:      '#64b4ff',
  purple:    '#a78bfa',
  teal:      '#5DCAA5',
  cyanDim:   'rgba(100,180,255,0.12)',
};

const WaveformIcon: React.FC<{ size?: number }> = ({ size = 20 }) => {
  const bars = [0.45, 0.75, 1, 0.75, 0.45];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2.5, height: size }}>
      {bars.map((ratio, i) => (
        <LinearGradient
          key={i}
          colors={[C.cyan, C.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ width: 2.5, height: size * ratio, borderRadius: 1.5, opacity: 0.85 }}
        />
      ))}
    </View>
  );
};

const BalanceCard: React.FC<{
  balanceCredits: number;
  loading: boolean;
  onTopUp: () => void;
}> = ({ balanceCredits, loading, onTopUp }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const MAX_CREDITS = 500;
  const fillPct = Math.min((balanceCredits / MAX_CREDITS) * 100, 100);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: fillPct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [fillPct]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const whisperMins = Math.floor(balanceCredits / (0.0167 * 60));
  const usdDisplay = '$' + (balanceCredits * 0.01).toFixed(2);

  return (
    <View style={s.balCard}>
      <View style={s.balTop}>
        <Text style={s.balLabel}>Balance</Text>
        <View style={s.activeBadge}>
          <Text style={s.activeBadgeText}>Active</Text>
        </View>
      </View>
      <Text style={s.balAmount}>{loading ? '—' : usdDisplay}</Text>
      <Text style={s.balSub}>{loading ? '—' : balanceCredits} credits</Text>
      <Text style={s.balMins}>{loading ? '' : `~${whisperMins} min of transcription`}</Text>
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFillWrap, { width: progressWidth }]}>
          <LinearGradient
            colors={[C.cyan, C.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <TouchableOpacity onPress={onTopUp} style={s.topUpInline} activeOpacity={0.7}>
        <Text style={s.topUpInlineText}>+ Add credits</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen() {
  const { balance_credits, balance_usd_display, loading, refresh } = useBalance();
  const { topUp, loading: paymentLoading, error: paymentError } = usePayment();
  const { signOut, user } = useAuthStore();
  const { t, language, setLanguage } = useLanguageStore();
  const [showTopUp, setShowTopUp] = useState(false);

  async function handleRecord() {
    router.push({ pathname: '/(app)/record' });
  }

  async function handleUpload() {
    const file = await pickAudioFile();
    if (!file) return;
    const durationSeconds = await getAudioDuration(file.uri);
    router.push({
      pathname: '/(app)/processing',
      params: { fileUri: file.uri, durationSeconds: String(Math.ceil(durationSeconds)) },
    });
  }

  async function handleTopUp(pkg: TopUpPackage) {
    setShowTopUp(false);
    const result = await topUp(pkg.amount_usd_cents);
    if (result.success) {
      Alert.alert('', pkg.credits + ' credits added!', [{ text: t.auth.ok, onPress: refresh }]);
    } else if (result.errorMsg) {
      Alert.alert('Payment failed', result.errorMsg);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.nav}>
          <View style={s.navLogo}>
            <WaveformIcon size={18} />
            <Text style={s.navLogoText}>Vocri</Text>
          </View>
          <View style={s.navRight}>
            <View style={s.langToggle}>
              {(['en', 'sv'] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[s.langBtn, language === lang && s.langBtnActive]}
                  onPress={() => setLanguage(lang)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.langBtnText, language === lang && s.langBtnTextActive]}>
                    {lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={async () => { console.log('signOut pressed, user:', user?.email); await signOut(); console.log('signOut done'); }} style={s.signOutBtn} activeOpacity={0.7}>
              {user?.email && <Text style={s.signOutEmail}>{user.email}</Text>}
              <Text style={s.signOutText}>{t.home.signOut}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BalanceCard
          balanceCredits={balance_credits ?? 0}
          loading={loading}
          onTopUp={() => setShowTopUp(true)}
        />

        <Text style={s.sectionTitle}>Quick actions</Text>
        <View style={s.actionGrid}>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnAccent]} onPress={handleRecord} activeOpacity={0.75}>
            <LinearGradient colors={[C.cyan, C.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <Text style={[s.actionLabel, s.actionLabelAccent]}>{t.home.recordLive}</Text>
            <Text style={[s.actionSub, s.actionSubAccent]}>Microphone</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={handleUpload} activeOpacity={0.75}>
            <Text style={s.actionLabel}>{t.home.uploadFile}</Text>
            <Text style={s.actionSub}>Audio file</Text>
          </TouchableOpacity>
        </View>

        <View style={s.promoCard}>
          <Text style={s.promoTag}>Vocri · Pay as you go</Text>
          <Text style={s.promoHeadline}>The simplest & cheapest way to transcribe.</Text>
          <Text style={s.promoSub}>Built for humans and AI agents. No subscriptions — ever.</Text>

          <View style={s.promoNodes}>
            <View style={s.nodeRow}>
              <View style={[s.node, s.nodeCyan]}><Text style={s.nodeText}>API</Text></View>
              <View style={[s.node, s.nodePurple]}><Text style={s.nodeText}>MCP</Text></View>
            </View>
            <View style={s.nodeCenter}>
              <View style={s.nodeLine} />
              <View style={[s.node, s.nodeMain]}>
                <LinearGradient colors={['#64b4ff', '#a78bfa']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={s.nodeMainText}>Vocri</Text>
              </View>
              <View style={s.nodeLine} />
            </View>
            <View style={s.nodeRow}>
              <View style={[s.node, s.nodeTeal]}><Text style={s.nodeText}>Mobile</Text></View>
              <View style={[s.node, s.nodeGray]}><Text style={s.nodeText}>AI agents</Text></View>
            </View>
          </View>

          <View style={s.pillRow}>
            <View style={s.pill}><Text style={s.pillText}>REST API</Text></View>
            <View style={s.pill}><Text style={s.pillText}>MCP server</Text></View>
            <View style={s.pill}><Text style={s.pillText}>No subscription</Text></View>
            <View style={[s.pill, s.pillAccent]}><Text style={[s.pillText, s.pillAccentText]}>Lowest price on market</Text></View>
          </View>
        </View>

      </ScrollView>

      <Modal visible={showTopUp} animationType="slide" transparent onRequestClose={() => setShowTopUp(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{t.topup.title}</Text>
            <Text style={s.modalSubtitle}>{t.topup.subtitle}</Text>
            <ScrollView style={s.packages} showsVerticalScrollIndicator={false}>
              {TOP_UP_PACKAGES.map((pkg) => (
                <TouchableOpacity key={pkg.amount_usd_cents} style={s.packageRow} onPress={() => handleTopUp(pkg)} disabled={paymentLoading} activeOpacity={0.75}>
                  <View>
                    <Text style={s.packageLabel}>{pkg.label}</Text>
                    <Text style={s.packageCredits}>{pkg.credits} credits</Text>
                  </View>
                  {pkg.bonus_pct && (
                    <View style={s.bonusBadge}>
                      <Text style={s.bonusText}>+{pkg.bonus_pct}% bonus</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowTopUp(false)}>
              <Text style={s.cancelText}>{t.topup.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },
  scroll:            { flex: 1 },
  scrollContent:     { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  nav:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navLogo:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogoText:       { fontSize: 18, fontWeight: '600', color: C.white, letterSpacing: -0.5 },
  navRight:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langToggle:        { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 99, borderWidth: 1, borderColor: C.white08, padding: 3, gap: 2 },
  langBtn:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  langBtnActive:     { backgroundColor: C.purple },
  langBtnText:       { fontSize: 11, fontWeight: '700', color: C.white35 },
  langBtnTextActive: { color: C.white },
  signOutBtn:        { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'flex-end' },
  signOutEmail:      { fontSize: 11, color: C.white35, marginBottom: 2 },
  signOutText:       { fontSize: 12, color: C.white35 },
  balCard:           { backgroundColor: C.surface, borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  balTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  balLabel:          { fontSize: 11, color: C.white35, textTransform: 'uppercase', letterSpacing: 0.8 },
  activeBadge:       { backgroundColor: C.cyanDim, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  activeBadgeText:   { fontSize: 10, color: C.cyan, fontWeight: '500' },
  balAmount:         { fontSize: 40, fontWeight: '600', color: C.white, letterSpacing: -1.5, marginBottom: 2 },
  balSub:            { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  balMins:           { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  progressTrack:     { height: 3, backgroundColor: C.white05, borderRadius: 99, overflow: 'hidden', marginBottom: 14 },
  progressFillWrap:  { height: '100%', borderRadius: 99, overflow: 'hidden' },
  topUpInline:       { alignSelf: 'flex-start', backgroundColor: C.cyanDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  topUpInlineText:   { fontSize: 12, color: C.cyan, fontWeight: '500' },
  sectionTitle:      { fontSize: 11, fontWeight: '500', color: C.white25, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 12 },
  actionGrid:        { flexDirection: 'row', gap: 12 },
  actionBtn:         { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: C.white05, overflow: 'hidden' },
  actionBtnAccent:   { borderColor: 'transparent' },
  actionLabel:       { fontSize: 14, fontWeight: '600', color: C.white70, marginBottom: 3 },
  actionLabelAccent: { color: C.white },
  actionSub:         { fontSize: 12, color: C.white35 },
  actionSubAccent:   { color: 'rgba(255,255,255,0.65)' },
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:        { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12, borderTopWidth: 1, borderColor: C.white08 },
  modalHandle:       { width: 36, height: 4, backgroundColor: C.white25, borderRadius: 99, alignSelf: 'center', marginBottom: 8 },
  modalTitle:        { fontSize: 18, fontWeight: '600', color: C.white, letterSpacing: -0.3 },
  modalSubtitle:     { fontSize: 13, color: C.white35 },
  packages:          { maxHeight: 280 },
  packageRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.white05 },
  packageLabel:      { fontSize: 15, fontWeight: '600', color: C.white70, marginBottom: 2 },
  packageCredits:    { fontSize: 12, color: C.white35 },
  bonusBadge:        { backgroundColor: 'rgba(93,202,165,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  bonusText:         { color: '#5DCAA5', fontSize: 12, fontWeight: '600' },
  cancelBtn:         { alignItems: 'center', paddingVertical: 14 },
  cancelText:        { fontSize: 14, color: C.white35 },
  promoCard:         { backgroundColor: '#131328', borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(100,180,255,0.12)' },
  promoTag:          { fontSize: 11, fontWeight: '600', color: 'rgba(100,180,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, textAlign: 'center' },
  promoHeadline:     { fontSize: 16, fontWeight: '600', color: '#ffffff', lineHeight: 22, marginBottom: 4, letterSpacing: -0.2 },
  promoSub:          { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18, marginBottom: 20 },
  promoNodes:        { alignItems: 'center', marginBottom: 20, gap: 8 },
  nodeRow:           { flexDirection: 'row', gap: 12 },
  nodeCenter:        { flexDirection: 'row', alignItems: 'center', gap: 0 },
  nodeLine:          { width: 40, height: 1, backgroundColor: 'rgba(100,180,255,0.2)' },
  node:              { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0d0d1a' },
  nodeMain:          { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 99, borderWidth: 0, backgroundColor: 'transparent', overflow: 'hidden' },
  nodeMainText:      { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  nodeText:          { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  nodeCyan:          { borderColor: 'rgba(100,180,255,0.3)' },
  nodePurple:        { borderColor: 'rgba(167,139,250,0.3)' },
  nodeTeal:          { borderColor: 'rgba(93,202,165,0.3)' },
  nodeGray:          { borderColor: 'rgba(255,255,255,0.1)' },
  pillRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  pill:              { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pillAccent:        { backgroundColor: 'rgba(100,180,255,0.1)', borderColor: 'rgba(100,180,255,0.3)' },
  pillText:          { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  pillAccentText:    { color: '#64b4ff' },
});
