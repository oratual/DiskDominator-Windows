"use client"

import React from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useUserCredits } from "@/hooks/useUserCredits";
import UserMenu from "./user-menu";
import UserProfileButton from "./user-profile-button";

interface UserManagementProps {
  // For backward compatibility - these will be overridden by hook data
  userName?: string;
  userEmail?: string;
  credits?: number;
  
  // Display mode
  mode?: 'menu' | 'button';
  
  // Event handlers
  onUserClick?: () => void;
}

/**
 * UserManagement component that provides a unified interface for user data
 * Automatically loads user data from Tauri backend and manages state
 */
export default function UserManagement({ 
  userName: propUserName, 
  userEmail: propUserEmail, 
  credits: propCredits,
  mode = 'menu',
  onUserClick 
}: UserManagementProps) {
  // Load all user data
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();
  const { preferences, loading: prefsLoading } = useUserPreferences();
  const { settings, loading: accessibilityLoading } = useAccessibility();
  const { credits: userCredits, loading: creditsLoading } = useUserCredits();

  // Determine actual values from hooks or props
  const userName = profile?.name || propUserName || "Usuario";
  const userEmail = profile?.email || propUserEmail || "usuario@diskdominator.com";
  const credits = userCredits?.balance ?? propCredits ?? 0;

  // Handle loading states
  if (profileLoading && !profile) {
    return (
      <div className="flex items-center justify-center w-10 h-10">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle error states
  if (profileError) {
    console.error('User profile error:', profileError);
    // Still render with fallback data
  }

  // Render based on mode
  if (mode === 'button') {
    return (
      <UserProfileButton 
        userName={userName}
        onClick={onUserClick}
      />
    );
  }

  return (
    <UserMenu 
      userName={userName}
      userEmail={userEmail}
      credits={credits}
    />
  );
}

// Export hook for components that need direct access to user data
export {
  useUserProfile
} from "@/hooks/useUserProfile";

export {
  useUserPreferences
} from "@/hooks/useUserPreferences";

export {
  useAccessibility
} from "@/hooks/useAccessibility";

export {
  useUserCredits
} from "@/hooks/useUserCredits";

// Type exports for convenience
export type {
  UserProfile,
  UserStats
} from "@/hooks/useUserProfile";

export type {
  UserPreferences,
  ReadabilitySettings,
  NotificationSettings,
  PrivacySettings
} from "@/hooks/useUserPreferences";

export type {
  UserCredits,
  CreditTransaction
} from "@/hooks/useUserCredits";