import { useState, useEffect, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface CreditTransaction {
  id: string;
  transaction_type: 'earned' | 'spent' | 'purchased';
  amount: number;
  description: string;
  date: string;
  metadata?: Record<string, string>;
}

export interface UserCredits {
  balance: number;
  history: CreditTransaction[];
  pending: number;
}

interface UseUserCreditsResult {
  credits: UserCredits | null;
  loading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
  addCredits: (amount: number, description: string, type?: string) => Promise<void>;
  spendCredits: (amount: number, description: string) => Promise<void>;
  canAfford: (amount: number) => boolean;
}

export const useUserCredits = (): UseUserCreditsResult => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredits = await invoke<UserCredits>('get_user_credits');
      setCredits(userCredits);
    } catch (err) {
      console.error('Failed to fetch user credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    await fetchCredits();
  }, [fetchCredits]);

  const addCredits = useCallback(async (
    amount: number, 
    description: string, 
    type: string = 'earned'
  ) => {
    try {
      const updatedCredits = await invoke<UserCredits>('add_user_credits', {
        amount,
        description,
        transaction_type: type,
      });
      
      setCredits(updatedCredits);
      
      // Broadcast credit change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creditsChanged', { 
          detail: { type: 'added', amount, balance: updatedCredits.balance }
        }));
      }
    } catch (err) {
      console.error('Failed to add credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to add credits');
      throw err;
    }
  }, []);

  const spendCredits = useCallback(async (amount: number, description: string) => {
    try {
      const updatedCredits = await invoke<UserCredits>('spend_user_credits', {
        amount,
        description,
      });
      
      setCredits(updatedCredits);
      
      // Broadcast credit change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('creditsChanged', { 
          detail: { type: 'spent', amount, balance: updatedCredits.balance }
        }));
      }
    } catch (err) {
      console.error('Failed to spend credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to spend credits');
      throw err;
    }
  }, []);

  const canAfford = useCallback((amount: number): boolean => {
    return credits ? credits.balance >= amount : false;
  }, [credits]);

  // Listen for credit changes from other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCreditsChange = () => {
      fetchCredits();
    };

    window.addEventListener('creditsChanged', handleCreditsChange);

    return () => {
      window.removeEventListener('creditsChanged', handleCreditsChange);
    };
  }, [fetchCredits]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    credits,
    loading,
    error,
    refreshCredits,
    addCredits,
    spendCredits,
    canAfford,
  };
};