import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { BalanceState } from '../types';

const DEFAULT_STATE: BalanceState = {
  balance_credits: 0,
  balance_usd_display: '$0.00',
  pricing: [],
};

export function useBalance() {
  const [state, setState] = useState<BalanceState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<BalanceState>('/api/balance');
      setState(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, loading, error, refresh };
}
