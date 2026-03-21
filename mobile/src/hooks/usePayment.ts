// Web stub — Stripe native SDK is not available in browsers
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export function usePayment() {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const topUp = useCallback(async (_amount_usd_cents: number): Promise<boolean> => {
    Alert.alert(
      'Saldopåfyllning',
      'Betalning är tillgänglig i iOS/Android-appen.'
    );
    return false;
  }, []);

  return { topUp, loading, error };
}
