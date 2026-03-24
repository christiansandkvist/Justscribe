import { useState, useCallback } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../services/api';

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const topUp = useCallback(
    async (amount_usd_cents: number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.post<{
          client_secret: string;
          credits_to_add: number;
        }>('/api/payments/create-intent', { amount_usd_cents });

        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: data.client_secret,
          merchantDisplayName: 'ScribeToGo',
          allowsDelayedPaymentMethods: false,
        });

        if (initError) { setError(initError.message); return false; }

        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code === 'Canceled') return false;
          setError(presentError.message);
          return false;
        }

        return true;
      } catch (err: any) {
        setError(err.message ?? 'Payment failed');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [initPaymentSheet, presentPaymentSheet]
  );

  return { topUp, loading, error };
}
