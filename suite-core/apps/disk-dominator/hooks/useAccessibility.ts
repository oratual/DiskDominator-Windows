import { useState, useEffect, useCallback } from 'react';
import { invoke } from './use-tauri';
import { ReadabilitySettings } from './useUserPreferences';

interface UseAccessibilityResult {
  settings: ReadabilitySettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<ReadabilitySettings>) => Promise<void>;
  setTextSize: (size: ReadabilitySettings['text_size']) => Promise<void>;
  setContrast: (contrast: ReadabilitySettings['contrast']) => Promise<void>;
  setSpacing: (spacing: ReadabilitySettings['spacing']) => Promise<void>;
  setColorFilter: (filter: ReadabilitySettings['color_filter']) => Promise<void>;
  toggleHighContrast: () => Promise<void>;
  toggleReduceMotion: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export const useAccessibility = (): UseAccessibilityResult => {
  const [settings, setSettings] = useState<ReadabilitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const prefs = await invoke<{ readability: ReadabilitySettings }>('get_user_preferences');
      setSettings(prefs.readability);
      
      // Apply settings to DOM immediately
      applyAccessibilitySettings(prefs.readability);
    } catch (err) {
      console.error('Failed to fetch accessibility settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accessibility settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<ReadabilitySettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await invoke<{ readability: ReadabilitySettings }>('update_accessibility_settings', { 
        readability: updatedSettings 
      });
      
      setSettings(response.readability);
      applyAccessibilitySettings(response.readability);
      
      // Broadcast changes for cross-tab synchronization
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('accessibilityChanged', { 
          detail: response.readability 
        }));
      }
    } catch (err) {
      console.error('Failed to update accessibility settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update accessibility settings');
      throw err;
    }
  }, [settings]);

  const setTextSize = useCallback(async (size: ReadabilitySettings['text_size']) => {
    await updateSettings({ text_size: size });
  }, [updateSettings]);

  const setContrast = useCallback(async (contrast: ReadabilitySettings['contrast']) => {
    await updateSettings({ contrast });
  }, [updateSettings]);

  const setSpacing = useCallback(async (spacing: ReadabilitySettings['spacing']) => {
    await updateSettings({ spacing });
  }, [updateSettings]);

  const setColorFilter = useCallback(async (filter: ReadabilitySettings['color_filter']) => {
    await updateSettings({ color_filter: filter });
  }, [updateSettings]);

  const toggleHighContrast = useCallback(async () => {
    if (!settings) return;
    await updateSettings({ high_contrast_mode: !settings.high_contrast_mode });
  }, [settings, updateSettings]);

  const toggleReduceMotion = useCallback(async () => {
    if (!settings) return;
    await updateSettings({ reduce_motion: !settings.reduce_motion });
  }, [settings, updateSettings]);

  const resetToDefaults = useCallback(async () => {
    const defaultSettings: ReadabilitySettings = {
      text_size: 'normal',
      contrast: 'normal',
      spacing: 'normal',
      color_filter: 'none',
      reduce_motion: false,
      high_contrast_mode: false,
    };

    await updateSettings(defaultSettings);
  }, [updateSettings]);

  // Apply accessibility settings to the DOM
  const applyAccessibilitySettings = useCallback((accessSettings: ReadabilitySettings) => {
    if (typeof document === 'undefined') return;

    // Apply text size
    document.documentElement.setAttribute('data-text-size', accessSettings.text_size);

    // Apply contrast settings
    if (accessSettings.contrast === 'high' || accessSettings.high_contrast_mode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply spacing
    if (accessSettings.spacing === 'wide') {
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
    
    if (accessSettings.color_filter !== 'none') {
      document.documentElement.classList.add(`filter-${accessSettings.color_filter}`);
    }

    // Apply motion reduction
    if (accessSettings.reduce_motion) {
      document.documentElement.classList.add('reduce-motion');
      // Also apply CSS media query override
      const style = document.getElementById('reduce-motion-override') || document.createElement('style');
      style.id = 'reduce-motion-override';
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.documentElement.classList.remove('reduce-motion');
      const style = document.getElementById('reduce-motion-override');
      if (style) {
        style.remove();
      }
    }

    // Add accessibility announcement for screen readers
    announceAccessibilityChange(accessSettings);
  }, []);

  // Announce accessibility changes to screen readers
  const announceAccessibilityChange = useCallback((accessSettings: ReadabilitySettings) => {
    if (typeof document === 'undefined') return;

    const announcer = document.getElementById('accessibility-announcer') || (() => {
      const el = document.createElement('div');
      el.id = 'accessibility-announcer';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.style.position = 'absolute';
      el.style.left = '-10000px';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.overflow = 'hidden';
      document.body.appendChild(el);
      return el;
    })();

    // Create announcement based on changed settings
    let announcement = 'Configuración de accesibilidad actualizada: ';
    
    if (accessSettings.text_size === 'large') {
      announcement += 'Texto grande activado. ';
    } else if (accessSettings.text_size === 'small') {
      announcement += 'Texto pequeño activado. ';
    }
    
    if (accessSettings.high_contrast_mode || accessSettings.contrast === 'high') {
      announcement += 'Alto contraste activado. ';
    }
    
    if (accessSettings.color_filter !== 'none') {
      announcement += `Filtro de color ${accessSettings.color_filter} activado. `;
    }
    
    if (accessSettings.reduce_motion) {
      announcement += 'Movimiento reducido activado. ';
    }

    announcer.textContent = announcement;
  }, []);

  // Listen for accessibility changes from other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAccessibilityChange = (e: Event) => {
      const customEvent = e as CustomEvent<ReadabilitySettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
        applyAccessibilitySettings(customEvent.detail);
      }
    };

    window.addEventListener('accessibilityChanged', handleAccessibilityChange);

    return () => {
      window.removeEventListener('accessibilityChanged', handleAccessibilityChange);
    };
  }, [applyAccessibilitySettings]);

  // Keyboard shortcuts for accessibility
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyboard = (e: KeyboardEvent) => {
      // Only handle if Alt + Shift are pressed (accessibility shortcuts)
      if (!e.altKey || !e.shiftKey) return;

      switch (e.key) {
        case 'C': // Alt + Shift + C for high contrast
          e.preventDefault();
          toggleHighContrast();
          break;
        case 'M': // Alt + Shift + M for motion reduction
          e.preventDefault();
          toggleReduceMotion();
          break;
        case '+': // Alt + Shift + + for larger text
          e.preventDefault();
          if (settings?.text_size === 'small') {
            setTextSize('normal');
          } else if (settings?.text_size === 'normal') {
            setTextSize('large');
          }
          break;
        case '-': // Alt + Shift + - for smaller text
          e.preventDefault();
          if (settings?.text_size === 'large') {
            setTextSize('normal');
          } else if (settings?.text_size === 'normal') {
            setTextSize('small');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [settings, toggleHighContrast, toggleReduceMotion, setTextSize]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    setTextSize,
    setContrast,
    setSpacing,
    setColorFilter,
    toggleHighContrast,
    toggleReduceMotion,
    resetToDefaults,
  };
};