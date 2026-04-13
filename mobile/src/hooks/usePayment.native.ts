import { useState, useCallback } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../services/api';

export interface TopUpResult {
  success: boolean;
  errorMsg?: string;
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const topUp = useCallback(
    async (amount_usd_cents: number): Promise<TopUpResult> => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.post<{
          client_secret: string;
          credits_to_add: number;
        }>('/api/payments/create-intent', { amount_usd_cents });

        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: data.client_secret,
          merchantDisplayName: 'Vocri',
          allowsDelayedPaymentMethods: false,
        });

        if (initError) {
          setError(initError.message);
          return { success: false, errorMsg: initError.message };
        }

        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code === 'Canceled') return { success: false };
          setError(presentError.message);
          return { success: false, errorMsg: presentError.message };
        }

        return { success: true };
      } catch (err: any) {
        const msg = err.message ?? 'Payment failed';
        setError(msg);
        return { success: false, errorMsg: msg };
      } finally {
        setLoading(false);
      }
    },
    [initPaymentSheet, presentPaymentSheet]
  );

  return { topUp, loading, error };
}
