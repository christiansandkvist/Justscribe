import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useBalance } from '../../hooks/useBalance';
import { useLanguageStore } from '../../store/languageStore';
import { CostEstimate } from '../../components/CostEstimate';
import { DEFAULT_PRICING, estimateCost } from '../../constants/pricing';
import type { TranscriptionModel } from '../../types';

const C = {
  bg:      '#0d0d1a',
  surface: '#131328',
  border:  'rgba(100,180,255,0.12)',
  white:   '#ffffff',
  white70: 'rgba(255,255,255,0.70)',
  white35: 'rgba(255,255,255,0.35)',
  white05: 'rgba(255,255,255,0.05)',
  cyan:    '#64b4ff',
  purple:  '#a78bfa',
  teal:    '#5DCAA5',
};

export default function ChooseSpeedScreen() {
  const params = useLocalSearchParams<{ source: 'record' | 'file'; fileUri?: string; fileDurationSeconds?: string; }>();
  const { balance_credits, balance_usd_display, pricing, loading } = useBalance();
  const { t } = useLanguageStore();
  const source = params.source ?? 'record';
  const fileUri = params.fileUri;
  const durationSeconds = params.fileDurationSeconds ? Number(params.fileDurationSeconds) : 0;
  const standardPricing = pricing.find((p) => p.model === 'standard') ?? DEFAULT_PRICING.standard;
  const chirpPricing = pricing.find((p) => p.model === 'chirp') ?? DEFAULT_PRICING.chirp;

  function handleSelect(model: TranscriptionModel) {
    if (source === 'record') {
      router.push({ pathname: '/(app)/record', params: { model } });
    } else {
      router.push({ pathname: '/(app)/processing', params: { fileUri, model, durationSeconds: String(durationSeconds) } });
    }
  }

  const standardEstimate = durationSeconds > 0 ? estimateCost(durationSeconds, standardPricing) : null;
  const chirpEstimate = durationSeconds > 0 ? estimateCost(durationSeconds, chirpPricing) : null;
  const subtitleText = source === 'file' && durationSeconds > 0
    ? t.speed.fileSubtitle(Math.floor(durationSeconds / 60), Math.ceil(durationSeconds % 60))
    : t.speed.subtitle;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={s.backText}>← {t.speed.back}</Text>
          </TouchableOpacity>
          <View style={s.balancePill}>
            <Text style={s.balanceText}>{loading ? '...' : balance_usd_display}</Text>
          </View>
        </View>

        <Text style={s.title}>{t.speed.title}</Text>
        <Text style={s.subtitle}>{subtitleText}</Text>

        <TouchableOpacity style={s.option} onPress={() => handleSelect('standard')} activeOpacity={0.85}>
          <View style={s.optionHeader}>
            <View>
              <Text style={s.optionTitle}>{t.speed.standardTitle}</Text>
              <Text style={s.optionDesc}>{t.speed.standardDesc}</Text>
            </View>
            <View style={s.priceBadge}>
              <Text style={s.priceText}>${(standardPricing.credits_per_second * 60 * standardPricing.usd_per_credit).toFixed(3)}/min</Text>
            </View>
          </View>
          {standardEstimate && <Text style={s.estimate}>≈ {standardEstimate.usd}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.optionFast} onPress={() => handleSelect('chirp')} activeOpacity={0.85}>
          <LinearGradient colors={['rgba(100,180,255,0.1)', 'rgba(167,139,250,0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={s.optionHeader}>
            <View>
              <Text style={s.optionTitle}>{t.speed.fastTitle} ⚡</Text>
              <Text style={s.optionDesc}>{t.speed.fastDesc}</Text>
            </View>
            <View style={s.priceBadgeFast}>
              <Text style={s.priceFastText}>${(chirpPricing.credits_per_second * 60 * chirpPricing.usd_per_credit).toFixed(3)}/min</Text>
            </View>
          </View>
          {chirpEstimate && <Text style={s.estimateFast}>≈ {chirpEstimate.usd}</Text>}
        </TouchableOpacity>

        {durationSeconds > 0 && <CostEstimate durationSeconds={durationSeconds} pricing={standardPricing} currentBalance={balance_credits} />}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0d0d1a' },
  container:     { flex: 1, padding: 24, gap: 16 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back:          { padding: 4 },
  backText:      { fontSize: 14, color: '#64b4ff', fontWeight: '500' },
  balancePill:   { backgroundColor: '#131328', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(100,180,255,0.12)' },
  balanceText:   { fontSize: 13, color: '#ffffff', fontWeight: '500' },
  title:         { fontSize: 28, fontWeight: '600', color: '#ffffff', letterSpacing: -0.5 },
  subtitle:      { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: -8 },
  option:        { backgroundColor: '#131328', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(100,180,255,0.12)', gap: 8 },
  optionFast:    { borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(100,180,255,0.3)', gap: 8, overflow: 'hidden' },
  optionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionTitle:   { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  optionDesc:    { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  priceBadge:    { backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  priceText:     { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  priceBadgeFast:{ backgroundColor: 'transparent', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(100,180,255,0.4)' },
  priceFastText: { fontSize: 12, fontWeight: '600', color: '#64b4ff' },
  estimate:      { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.35)' },
  estimateFast:  { fontSize: 14, fontWeight: '500', color: '#64b4ff' },
});
