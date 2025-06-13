import { useState, useEffect, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  credits: number;
  plan: 'Free' | 'Pro' | 'Enterprise';
  created_at: string;
  last_login: string;
  stats: UserStats;
}

export interface UserStats {
  total_scans: number;
  space_saved: number;
  files_organized: number;
  duplicates_removed: number;
  large_files_found: number;
}

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateStats: (stats: UserStats) => Promise<void>;
}

export const useUserProfile = (): UseUserProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userProfile = await invoke<UserProfile>('get_user_profile');
      setProfile(userProfile);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const updateStats = useCallback(async (stats: UserStats) => {
    try {
      const updatedProfile = await invoke<UserProfile>('update_user_stats', { stats });
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Failed to update user stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to update stats');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateStats,
  };
};