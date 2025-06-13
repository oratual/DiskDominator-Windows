import { UserProfile, UserStats } from "@/hooks/useUserProfile";
import { UserPreferences, ReadabilitySettings } from "@/hooks/useUserPreferences";
import { CreditTransaction } from "@/hooks/useUserCredits";

/**
 * Utility functions for working with user data
 */

// Profile utilities
export const formatUserName = (profile: UserProfile | null): string => {
  if (!profile) return "Usuario";
  return profile.name || "Usuario";
};

export const getUserInitials = (profile: UserProfile | null): string => {
  if (!profile?.name) return "U";
  
  const names = profile.name.split(" ");
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

export const formatUserPlan = (plan: UserProfile['plan']): string => {
  const planNames = {
    Free: "Gratuito",
    Pro: "Profesional", 
    Enterprise: "Empresarial"
  };
  
  return planNames[plan] || plan;
};

// Stats utilities
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const calculateUserProgress = (stats: UserStats): {
  totalActions: number;
  efficiencyScore: number;
  spaceRecoveryRate: number;
} => {
  const totalActions = stats.total_scans + stats.files_organized + stats.duplicates_removed;
  
  // Calculate efficiency score (0-100)
  const efficiencyScore = Math.min(100, Math.round(
    (stats.files_organized * 2 + stats.duplicates_removed * 3 + stats.total_scans) / 10
  ));
  
  // Calculate space recovery rate (GB per scan)
  const spaceRecoveryRate = stats.total_scans > 0 
    ? stats.space_saved / stats.total_scans / (1024 * 1024 * 1024)
    : 0;
  
  return {
    totalActions,
    efficiencyScore,
    spaceRecoveryRate
  };
};

// Credit utilities
export const formatCredits = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
};

export const getCreditBalanceStatus = (balance: number): {
  status: 'low' | 'medium' | 'high';
  message: string;
  color: string;
} => {
  if (balance < 10) {
    return {
      status: 'low',
      message: 'Créditos bajos - considera obtener más',
      color: 'text-red-500'
    };
  } else if (balance < 50) {
    return {
      status: 'medium', 
      message: 'Tienes suficientes créditos',
      color: 'text-yellow-500'
    };
  } else {
    return {
      status: 'high',
      message: 'Excelente balance de créditos',
      color: 'text-green-500'
    };
  }
};

export const calculateCreditTrend = (transactions: CreditTransaction[]): {
  trend: 'increasing' | 'decreasing' | 'stable';
  weeklyChange: number;
} => {
  if (transactions.length < 2) {
    return { trend: 'stable', weeklyChange: 0 };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentTransactions = transactions.filter(t => 
    new Date(t.date) >= oneWeekAgo
  );
  
  const weeklyChange = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (weeklyChange > 5) {
    trend = 'increasing';
  } else if (weeklyChange < -5) {
    trend = 'decreasing';
  }
  
  return { trend, weeklyChange };
};

// Accessibility utilities
export const getAccessibilityDescription = (settings: ReadabilitySettings): string => {
  const features = [];
  
  if (settings.text_size === 'large') {
    features.push('texto grande');
  } else if (settings.text_size === 'small') {
    features.push('texto pequeño');
  }
  
  if (settings.contrast === 'high' || settings.high_contrast_mode) {
    features.push('alto contraste');
  }
  
  if (settings.spacing === 'wide') {
    features.push('espaciado amplio');
  }
  
  if (settings.color_filter !== 'none') {
    const filterNames = {
      grayscale: 'escala de grises',
      protanopia: 'filtro para protanopía',
      deuteranopia: 'filtro para deuteranopía',
      tritanopia: 'filtro para tritanopía'
    };
    features.push(filterNames[settings.color_filter as keyof typeof filterNames] || settings.color_filter);
  }
  
  if (settings.reduce_motion) {
    features.push('movimiento reducido');
  }
  
  if (features.length === 0) {
    return 'Configuración estándar';
  }
  
  return `Activo: ${features.join(', ')}`;
};

// Theme utilities
export const getThemeDisplayName = (theme: string): string => {
  const themeNames = {
    light: 'Tema Claro',
    dark: 'Tema Oscuro', 
    system: 'Tema del Sistema'
  };
  
  return themeNames[theme as keyof typeof themeNames] || theme;
};

// Date utilities for user data
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return 'Ahora mismo';
  } else if (diffMins < 60) {
    return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  } else if (diffDays < 7) {
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('es-ES');
  }
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUserName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 50 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
};

// Export utility functions for external use
export const UserUtils = {
  formatUserName,
  getUserInitials,
  formatUserPlan,
  formatBytes,
  calculateUserProgress,
  formatCredits,
  getCreditBalanceStatus,
  calculateCreditTrend,
  getAccessibilityDescription,
  getThemeDisplayName,
  formatRelativeDate,
  isValidEmail,
  isValidUserName
};