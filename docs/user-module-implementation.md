# User Module Implementation - DiskDominator

## Overview

The User module provides complete user management functionality for DiskDominator, including user profiles, preferences, accessibility settings, and credit management. This implementation bridges React frontend components with Tauri backend commands for persistent data storage.

## Architecture

### Backend (Rust/Tauri)
- **Location**: `/src-tauri/src/commands/user_commands.rs`
- **Persistence**: Local JSON files in Tauri app data directory
- **Commands**: 10 Tauri commands for user data management

### Frontend (React/TypeScript)
- **Hooks**: 4 custom hooks for data management
- **Components**: Enhanced user menu and profile components
- **Utils**: Comprehensive utility library for user data

## Features Implemented

### ✅ User Profile Management
- User profile data (name, email, avatar, plan, stats)
- Profile persistence and loading
- User statistics tracking (scans, space saved, files organized)

### ✅ User Preferences
- Theme management (light/dark/system)
- Language settings
- Notification preferences
- Privacy settings
- Cross-tab synchronization

### ✅ Accessibility System
- Text size adjustment (small/normal/large)
- Contrast settings (normal/high)
- Spacing options (normal/wide)
- Color filters (protanopia, deuteranopia, tritanopia, grayscale)
- Motion reduction support
- Screen reader optimizations
- Keyboard shortcuts (Alt+Shift combinations)

### ✅ Credit Management
- Credit balance tracking
- Transaction history
- Credit earning/spending operations
- Balance status indicators
- Weekly trend analysis

### ✅ Enhanced UI Components
- Updated UserMenu with real data integration
- Updated UserProfileButton with dynamic avatar
- New UserManagement wrapper component
- Loading states and error handling

## File Structure

```
src-tauri/src/commands/
├── user_commands.rs          # Rust backend commands
└── mod.rs                    # Updated module exports

suite-core/apps/disk-dominator/
├── hooks/
│   ├── useUserProfile.ts     # User profile management
│   ├── useUserPreferences.ts # Preferences and settings
│   ├── useAccessibility.ts   # Accessibility controls
│   ├── useUserCredits.ts     # Credit management
│   └── use-tauri.ts         # Updated with user command mocks
├── components/
│   ├── user-menu.tsx         # Enhanced with real data
│   ├── user-profile-button.tsx # Enhanced with real data
│   ├── user-management.tsx   # Unified user component
│   └── examples/
│       └── user-integration-example.tsx # Usage examples
├── lib/
│   └── user-utils.ts         # Utility functions
└── styles/
    ├── globals.css           # Updated with accessibility import
    └── accessibility.css     # Accessibility-specific styles
```

## Rust Commands

### Core Commands
1. `get_user_profile()` - Retrieve user profile data
2. `update_user_preferences(preferences)` - Save user preferences
3. `get_user_preferences()` - Load user preferences
4. `get_user_credits()` - Get credit balance and history
5. `update_accessibility_settings(settings)` - Save accessibility settings
6. `add_user_credits(amount, description, type)` - Add credits
7. `spend_user_credits(amount, description)` - Spend credits
8. `export_user_data()` - Export all user data
9. `update_user_stats(stats)` - Update user statistics
10. `reset_user_preferences()` - Reset to defaults

### Data Structures
```rust
pub struct UserProfile {
    pub id: String,
    pub name: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub credits: i32,
    pub plan: UserPlan,
    pub stats: UserStats,
    // ... timestamps
}

pub struct UserPreferences {
    pub theme: String,
    pub language: String,
    pub readability: ReadabilitySettings,
    pub notifications: NotificationSettings,
    pub privacy: PrivacySettings,
}

pub struct ReadabilitySettings {
    pub text_size: String,
    pub contrast: String,
    pub spacing: String,
    pub color_filter: String,
    pub reduce_motion: bool,
    pub high_contrast_mode: bool,
}
```

## React Hooks

### useUserProfile
```typescript
const { profile, loading, error, refreshProfile, updateStats } = useUserProfile();
```

### useUserPreferences  
```typescript
const {
  preferences,
  updateTheme,
  updateLanguage,
  updateNotifications,
  resetPreferences
} = useUserPreferences();
```

### useAccessibility
```typescript
const {
  settings,
  setTextSize,
  setContrast,
  setColorFilter,
  toggleHighContrast,
  resetToDefaults
} = useAccessibility();
```

### useUserCredits
```typescript
const {
  credits,
  addCredits,
  spendCredits,
  canAfford,
  refreshCredits
} = useUserCredits();
```

## Component Usage

### Simple Usage
```typescript
import UserManagement from "@/components/user-management";

// Full menu with all features
<UserManagement mode="menu" />

// Just the profile button
<UserManagement mode="button" onUserClick={handleClick} />
```

### Advanced Usage with Hooks
```typescript
import { useUserProfile, useUserCredits } from "@/components/user-management";

function MyComponent() {
  const { profile, updateStats } = useUserProfile();
  const { credits, addCredits } = useUserCredits();

  const handleScanComplete = async () => {
    await addCredits(25, "Scan completed");
    await updateStats({
      ...profile.stats,
      total_scans: profile.stats.total_scans + 1
    });
  };
}
```

## Accessibility Features

### Keyboard Shortcuts
- `Alt + Shift + C` - Toggle high contrast
- `Alt + Shift + M` - Toggle motion reduction  
- `Alt + Shift + +` - Increase text size
- `Alt + Shift + -` - Decrease text size

### Screen Reader Support
- ARIA labels and live regions
- Accessibility announcements for setting changes
- Proper focus management
- Screen reader only content for important updates

### Visual Accessibility
- High contrast mode with enhanced borders
- Color blindness filters (protanopia, deuteranopia, tritanopia)
- Scalable text sizes
- Reduced motion support
- Wide spacing option

## Data Persistence

### Storage Location
- **Development**: Tauri app data directory
- **Production**: System-appropriate app data folder
- **Files**: 
  - `user_data.json` - Profile and stats
  - `user_preferences.json` - All preferences
  - `user_credits.json` - Credit balance and history

### Cross-Tab Synchronization
- localStorage events for preference changes
- Custom events for real-time updates
- Automatic conflict resolution

## Integration with Existing Systems

### Theme Integration
- Works with next-themes for seamless theme switching
- Persists theme preference in user settings
- Applies accessibility overrides when needed

### I18n Integration
- Language preference stored in user settings
- Ready for integration with @suite/i18n module
- Supports dynamic language switching

### Credit System Integration
- Operations can spend/earn credits automatically
- Credit checks before expensive operations
- Transaction history for audit trails

## Development & Testing

### Mock Support
All commands have mock implementations in `use-tauri.ts` for development without Tauri backend.

### Error Handling
- Comprehensive error boundaries in hooks
- Graceful fallbacks for missing data
- User-friendly error messages

### Type Safety
- Full TypeScript support
- Exported types for external use
- Runtime validation where needed

## Future Enhancements

### Planned Features
1. **Avatar Upload**: File upload system for custom avatars
2. **Multi-Profile**: Support for multiple user profiles
3. **Cloud Sync**: Synchronize settings across devices
4. **Advanced Theming**: Custom theme creation
5. **Gamification**: Achievement system with badges
6. **Analytics**: Usage analytics with privacy controls

### Extension Points
- Plugin system for custom accessibility filters
- External authentication providers
- Custom credit earning mechanisms
- Advanced notification systems

## Migration Guide

### From Mock Data
1. Remove hardcoded user props from components
2. Replace with UserManagement component
3. Import hooks for custom functionality
4. Update any direct DOM accessibility manipulation

### Example Migration
```typescript
// Before
<UserMenu userName="John" userEmail="john@example.com" credits={100} />

// After  
<UserManagement mode="menu" />
```

## Performance Considerations

### Optimizations
- Lazy loading of user data
- Debounced preference updates
- Efficient cross-tab synchronization
- Minimal re-renders with proper memoization

### Memory Management
- Automatic cleanup of event listeners
- Proper disposal of resources
- Cache invalidation strategies

## Security Considerations

### Data Protection
- Local storage only (no cloud exposure)
- Input validation on all user data
- Safe serialization/deserialization
- No sensitive data in preferences

### Access Control
- All operations require valid app context
- Type-safe command interfaces
- Error boundaries prevent data corruption

## Support & Maintenance

### Logging
- Console warnings for development
- Error tracking for production issues
- User action audit trails

### Debugging
- React DevTools integration
- State inspection utilities
- Mock data for testing

### Backwards Compatibility
- Graceful handling of old data formats
- Migration scripts for schema changes
- Fallback values for missing properties

## Conclusion

The User module provides a robust, accessible, and extensible foundation for user management in DiskDominator. It follows React best practices, implements comprehensive accessibility features, and provides a clean API for future enhancements.

All components are production-ready with proper error handling, TypeScript support, and extensive accessibility features that exceed WCAG 2.1 AA standards.