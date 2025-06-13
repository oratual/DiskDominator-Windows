import { useState, useEffect, useCallback } from 'react';
import { invoke } from './use-tauri';

export interface ReadabilitySettings {
  text_size: 'small' | 'normal' | 'large';
  contrast: 'normal' | 'high';
  spacing: 'normal' | 'wide';
  color_filter: 'none' | 'grayscale' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reduce_motion: boolean;
  high_contrast_mode: boolean;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  scan_complete: boolean;
  weekly_report: boolean;
  tips_and_tricks: boolean;
}

export interface PrivacySettings {
  share_analytics: boolean;
  show_profile_public: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  readability: ReadabilitySettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  updated_at: string;
}

interface UseUserPreferencesResult {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateTheme: (theme: UserPreferences['theme']) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  updateNotifications: (notifications: NotificationSettings) => Promise<void>;
  updatePrivacy: (privacy: PrivacySettings) => Promise<void>;
  resetPreferences: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

export const useUserPreferences = (): UseUserPreferencesResult => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userPrefs = await invoke<UserPreferences>('get_user_preferences');
      setPreferences(userPrefs);
      
      // Apply preferences to DOM
      applyPreferencesToDOM(userPrefs);
    } catch (err) {
      console.error('Failed to fetch user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    if (!preferences) return;

    try {
      const updatedPrefs = { ...preferences, ...newPrefs };
      const savedPrefs = await invoke<UserPreferences>('update_user_preferences', { 
        preferences: updatedPrefs 
      });
      
      setPreferences(savedPrefs);
      applyPreferencesToDOM(savedPrefs);
      
      // Broadcast change to other tabs/windows
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('user_preferences_updated', Date.now().toString());
        window.dispatchEvent(new CustomEvent('preferencesChanged', { detail: savedPrefs }));
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    }
  }, [preferences]);

  const updateTheme = useCallback(async (theme: UserPreferences['theme']) => {
    await updatePreferences({ theme });
  }, [updatePreferences]);

  const updateLanguage = useCallback(async (language: string) => {
    await updatePreferences({ language });
  }, [updatePreferences]);

  const updateNotifications = useCallback(async (notifications: NotificationSettings) => {
    await updatePreferences({ notifications });
  }, [updatePreferences]);

  const updatePrivacy = useCallback(async (privacy: PrivacySettings) => {
    await updatePreferences({ privacy });
  }, [updatePreferences]);

  const resetPreferences = useCallback(async () => {
    try {
      const defaultPrefs = await invoke<UserPreferences>('reset_user_preferences');
      setPreferences(defaultPrefs);
      applyPreferencesToDOM(defaultPrefs);
    } catch (err) {
      console.error('Failed to reset preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset preferences');
      throw err;
    }
  }, []);

  const refreshPreferences = useCallback(async () => {
    await fetchPreferences();
  }, [fetchPreferences]);

  // Apply preferences to DOM
  const applyPreferencesToDOM = useCallback((prefs: UserPreferences) => {
    if (typeof document === 'undefined') return;

    const { readability, theme } = prefs;

    // Apply text size
    document.documentElement.setAttribute('data-text-size', readability.text_size);

    // Apply contrast
    if (readability.contrast === 'high' || readability.high_contrast_mode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply spacing
    if (readability.spacing === 'wide') {
      document.documentElement.classList.add('wide-spacing');
    } else {
      document.documentElement.classList.remove('wide-spacing');
    }

    // Apply color filters
    const filterClasses = [
      'filter-none', 'filter-grayscale', 'filter-protanopia', 
      'filter-deuteranopia', 'filter-tritanopia'
    ];
    
    filterClasses.forEach(cls => document.documentElement.classList.remove(cls));
    
    if (readability.color_filter !== 'none') {
      document.documentElement.classList.add(`filter-${readability.color_filter}`);
    }

    // Apply motion reduction
    if (readability.reduce_motion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Theme is handled by next-themes, but we can store it for other components
    document.documentElement.setAttribute('data-user-theme', theme);
  }, []);

  // Listen for cross-tab preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_preferences_updated') {
        fetchPreferences();
      }
    };

    const handlePreferencesChange = (e: Event) => {
      const customEvent = e as CustomEvent<UserPreferences>;
      if (customEvent.detail) {
        setPreferences(customEvent.detail);
        applyPreferencesToDOM(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('preferencesChanged', handlePreferencesChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('preferencesChanged', handlePreferencesChange);
    };
  }, [fetchPreferences, applyPreferencesToDOM]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    updateTheme,
    updateLanguage,
    updateNotifications,
    updatePrivacy,
    resetPreferences,
    refreshPreferences,
  };
};