"use client"

import React from "react";
import UserManagement from "../user-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserProfile, useUserCredits, useAccessibility } from "../user-management";
import { UserUtils } from "@/lib/user-utils";

/**
 * Example component showing how to integrate the User module
 * This demonstrates both the high-level UserManagement component
 * and direct hook usage for custom functionality
 */
export default function UserIntegrationExample() {
  // Using hooks directly for custom functionality
  const { profile, updateStats } = useUserProfile();
  const { credits, addCredits, spendCredits, canAfford } = useUserCredits();
  const { settings, setTextSize, toggleHighContrast } = useAccessibility();

  const handleRewardUser = async () => {
    try {
      // Reward user with credits for completing an action
      await addCredits(25, "Escaneo completado con éxito");
      
      // Update user stats
      if (profile) {
        await updateStats({
          ...profile.stats,
          total_scans: profile.stats.total_scans + 1,
          space_saved: profile.stats.space_saved + 1024 * 1024 * 100, // 100MB saved
        });
      }
    } catch (error) {
      console.error("Failed to reward user:", error);
    }
  };

  const handleSpendCredits = async () => {
    try {
      if (canAfford(10)) {
        await spendCredits(10, "Operación avanzada de limpieza");
      } else {
        alert("No tienes suficientes créditos para esta operación");
      }
    } catch (error) {
      console.error("Failed to spend credits:", error);
    }
  };

  const handleAccessibilityToggle = async () => {
    try {
      await toggleHighContrast();
    } catch (error) {
      console.error("Failed to toggle accessibility:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Module Integration Example</h1>
      
      {/* High-level component usage */}
      <Card>
        <CardHeader>
          <CardTitle>User Menu Component</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This shows the UserManagement component in menu mode with real data:
          </p>
          <UserManagement mode="menu" />
        </CardContent>
      </Card>

      {/* Profile button usage */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile Button</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This shows the UserManagement component in button mode:
          </p>
          <UserManagement 
            mode="button" 
            onUserClick={() => console.log("User clicked!")}
          />
        </CardContent>
      </Card>

      {/* Direct hook usage examples */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Hook Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile && (
            <div>
              <h3 className="font-semibold mb-2">User Profile Information</h3>
              <p><strong>Name:</strong> {UserUtils.formatUserName(profile)}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Plan:</strong> {UserUtils.formatUserPlan(profile.plan)}</p>
              <p><strong>Initials:</strong> {UserUtils.getUserInitials(profile)}</p>
              <p><strong>Space Saved:</strong> {UserUtils.formatBytes(profile.stats.space_saved)}</p>
              
              {(() => {
                const progress = UserUtils.calculateUserProgress(profile.stats);
                return (
                  <div>
                    <p><strong>Total Actions:</strong> {progress.totalActions}</p>
                    <p><strong>Efficiency Score:</strong> {progress.efficiencyScore}/100</p>
                    <p><strong>Space Recovery Rate:</strong> {progress.spaceRecoveryRate.toFixed(2)} GB/scan</p>
                  </div>
                );
              })()}
            </div>
          )}

          {credits && (
            <div>
              <h3 className="font-semibold mb-2">Credit Information</h3>
              <p><strong>Balance:</strong> {UserUtils.formatCredits(credits.balance)}</p>
              
              {(() => {
                const status = UserUtils.getCreditBalanceStatus(credits.balance);
                return (
                  <p className={status.color}>
                    <strong>Status:</strong> {status.message}
                  </p>
                );
              })()}
              
              {(() => {
                const trend = UserUtils.calculateCreditTrend(credits.history);
                return (
                  <p>
                    <strong>Weekly Trend:</strong> {trend.trend} ({trend.weeklyChange > 0 ? '+' : ''}{trend.weeklyChange})
                  </p>
                );
              })()}
            </div>
          )}

          {settings && (
            <div>
              <h3 className="font-semibold mb-2">Accessibility Settings</h3>
              <p><strong>Current Settings:</strong> {UserUtils.getAccessibilityDescription(settings)}</p>
              <p><strong>Text Size:</strong> {settings.text_size}</p>
              <p><strong>Contrast:</strong> {settings.contrast}</p>
              <p><strong>Color Filter:</strong> {settings.color_filter}</p>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button onClick={handleRewardUser} variant="default">
              Reward User (+25 credits)
            </Button>
            
            <Button 
              onClick={handleSpendCredits} 
              variant="secondary"
              disabled={!canAfford(10)}
            >
              Spend Credits (-10)
            </Button>
            
            <Button onClick={handleAccessibilityToggle} variant="outline">
              Toggle High Contrast
            </Button>
            
            <Button 
              onClick={() => setTextSize(settings?.text_size === 'large' ? 'normal' : 'large')} 
              variant="outline"
            >
              Toggle Text Size
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backend integration info */}
      <Card>
        <CardHeader>
          <CardTitle>Backend Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>✅ Rust Commands:</strong> All user commands are registered and functional</p>
            <p><strong>✅ Local Storage:</strong> User data persists in Tauri app data directory</p>
            <p><strong>✅ React Hooks:</strong> Full TypeScript support with proper error handling</p>
            <p><strong>✅ Cross-tab Sync:</strong> Preferences sync across browser tabs/windows</p>
            <p><strong>✅ Accessibility:</strong> Full ARIA support with keyboard shortcuts</p>
            <p><strong>✅ Theme Integration:</strong> Works with next-themes</p>
            <p><strong>✅ Utils Library:</strong> Comprehensive formatting and validation utilities</p>
            <p><strong>✅ Mock Support:</strong> Works in development without Tauri backend</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}