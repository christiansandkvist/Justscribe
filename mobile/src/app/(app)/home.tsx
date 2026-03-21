import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useBalance } from '../../hooks/useBalance';
import { usePayment } from '../../hooks/usePayment';
import { useAuthStore } from '../../store/authStore';
import { BalanceBadge } from '../../components/BalanceBadge';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { pickAudioFile, getAudioDuration } from '../../services/fileService';
import { TOP_UP_PACKAGES } from '../../constants/pricing';
import type { TopUpPackage } from '../../types';

export default function HomeScreen() {
  const { balance_credits, balance_usd_display, loading, refresh } = useBalance();
  const { topUp, loading: paymentLoading } = usePayment();
  const { signOut } = useAuthStore();
  const [showTopUp, setShowTopUp] = useState(false);

  async function handleRecord() {
    router.push({
      pathname: '/(app)/choose-speed',
      params: { source: 'record' },
    });
  }

  async function handleUpload() {
    const file = await pickAudioFile();
    if (!file) return;

    const durationSeconds = await getAudioDuration(file.uri);

    router.push({
      pathname: '/(app)/choose-speed',
      params: {
        source: 'file',
        fileUri: file.uri,
        fileDurationSeconds: String(Math.ceil(durationSeconds)),
      },
    });
  }

  async function handleTopUp(pkg: TopUpPackage) {
    setShowTopUp(false);
    const success = await topUp(pkg.amount_usd_cents);
    if (success) {
      Alert.alert('Saldo påfyllt!', `${pkg.credits} credits har lagts till.`, [
        { text: 'OK', onPress: refresh },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Justscribe</Text>
          <BalanceBadge balanceUsdDisplay={balance_usd_display} loading={loading} />
        </View>

        {/* Main actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleRecord} activeOpacity={0.85}>
            <Text style={styles.actionIcon}>🎤</Text>
            <Text style={styles.actionLabel}>Spela in live</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleUpload} activeOpacity={0.85}>
            <Text style={styles.actionIcon}>📁</Text>
            <Text style={styles.actionLabel}>Ladda upp fil</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setShowTopUp(true)} style={styles.topUpLink}>
            <Text style={styles.topUpText}>+ Fyll på saldo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
            <Text style={styles.signOutText}>Logga ut</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top-up modal */}
      <Modal
        visible={showTopUp}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTopUp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Fyll på saldo</Text>
            <Text style={styles.modalSubtitle}>Välj belopp — betala en gång, använd när du vill</Text>

            <ScrollView style={styles.packages}>
              {TOP_UP_PACKAGES.map((pkg) => (
                <TouchableOpacity
                  key={pkg.amount_usd_cents}
                  style={styles.packageRow}
                  onPress={() => handleTopUp(pkg)}
                  disabled={paymentLoading}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.packageLabel}>{pkg.label}</Text>
                    <Text style={styles.packageCredits}>{pkg.credits} credits</Text>
                  </View>
                  {pkg.bonus_pct && (
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusText}>+{pkg.bonus_pct}% bonus</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTopUp(false)}>
              <Text style={styles.cancelText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  actions: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  actionBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  actionIcon: {
    fontSize: 48,
  },
  actionLabel: {
    ...Typography.h3,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  topUpLink: {
    padding: Spacing.sm,
  },
  topUpText: {
    ...Typography.body,
    color: Colors.accent,
    fontWeight: '700',
  },
  signOutLink: {
    padding: Spacing.sm,
  },
  signOutText: {
    ...Typography.bodySmall,
    color: Colors.secondary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    ...Typography.h2,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
  },
  packages: {
    maxHeight: 280,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  packageLabel: {
    ...Typography.h3,
  },
  packageCredits: {
    ...Typography.bodySmall,
  },
  bonusBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  bonusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.secondary,
  },
});
