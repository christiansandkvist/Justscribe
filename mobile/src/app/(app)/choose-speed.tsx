import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useBalance } from '../../hooks/useBalance';
import { CostEstimate } from '../../components/CostEstimate';
import { BalanceBadge } from '../../components/BalanceBadge';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { DEFAULT_PRICING, estimateCost } from '../../constants/pricing';
import type { TranscriptionModel } from '../../types';

export default function ChooseSpeedScreen() {
  const params = useLocalSearchParams<{
    source: 'record' | 'file';
    fileUri?: string;
    fileDurationSeconds?: string;
  }>();

  const { balance_credits, balance_usd_display, pricing, loading } = useBalance();

  const source = params.source ?? 'record';
  const fileUri = params.fileUri;
  const durationSeconds = params.fileDurationSeconds ? Number(params.fileDurationSeconds) : 0;

  // Use server pricing if available, fall back to defaults
  const standardPricing =
    pricing.find((p) => p.model === 'standard') ?? DEFAULT_PRICING.standard;
  const chirpPricing =
    pricing.find((p) => p.model === 'chirp') ?? DEFAULT_PRICING.chirp;

  function handleSelect(model: TranscriptionModel) {
    if (source === 'record') {
      router.push({ pathname: '/(app)/record', params: { model } });
    } else {
      router.push({
        pathname: '/(app)/processing',
        params: { fileUri, model, durationSeconds: String(durationSeconds) },
      });
    }
  }

  const standardEstimate = durationSeconds > 0 ? estimateCost(durationSeconds, standardPricing) : null;
  const chirpEstimate = durationSeconds > 0 ? estimateCost(durationSeconds, chirpPricing) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Tillbaka</Text>
          </TouchableOpacity>
          <BalanceBadge balanceUsdDisplay={balance_usd_display} loading={loading} />
        </View>

        <Text style={styles.title}>Välj hastighet</Text>
        <Text style={styles.subtitle}>
          {source === 'file' && durationSeconds > 0
            ? `Din fil är ${Math.ceil(durationSeconds / 60)} min ${Math.ceil(durationSeconds % 60)} sek`
            : 'Välj transkriberings-kvalitet'}
        </Text>

        {/* Standard option */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => handleSelect('standard')}
          activeOpacity={0.85}
        >
          <View style={styles.optionHeader}>
            <View>
              <Text style={styles.optionTitle}>Standard</Text>
              <Text style={styles.optionDesc}>Sparar pengar</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>
                ${(standardPricing.credits_per_second * 60 * standardPricing.usd_per_credit).toFixed(3)}/min
              </Text>
            </View>
          </View>
          {standardEstimate && (
            <Text style={styles.estimate}>≈ {standardEstimate.usd}</Text>
          )}
        </TouchableOpacity>

        {/* Chirp option */}
        <TouchableOpacity
          style={[styles.option, styles.optionFast]}
          onPress={() => handleSelect('chirp')}
          activeOpacity={0.85}
        >
          <View style={styles.optionHeader}>
            <View>
              <Text style={styles.optionTitle}>Snabb ⚡</Text>
              <Text style={styles.optionDesc}>Direkt resultat</Text>
            </View>
            <View style={[styles.priceBadge, styles.priceBadgeFast]}>
              <Text style={styles.priceText}>
                ${(chirpPricing.credits_per_second * 60 * chirpPricing.usd_per_credit).toFixed(3)}/min
              </Text>
            </View>
          </View>
          {chirpEstimate && (
            <Text style={styles.estimate}>≈ {chirpEstimate.usd}</Text>
          )}
        </TouchableOpacity>

        {/* Balance warning if file duration known */}
        {durationSeconds > 0 && (
          <CostEstimate
            durationSeconds={durationSeconds}
            pricing={standardPricing}
            currentBalance={balance_credits}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: { padding: Spacing.xs },
  backText: { ...Typography.body, color: Colors.accent, fontWeight: '600' },
  title: { ...Typography.h1 },
  subtitle: { ...Typography.bodySmall, marginTop: -Spacing.sm },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  optionFast: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: { ...Typography.h3 },
  optionDesc: { ...Typography.bodySmall },
  priceBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  priceBadgeFast: {
    backgroundColor: Colors.accent,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  estimate: {
    ...Typography.h3,
    color: Colors.accent,
  },
});
