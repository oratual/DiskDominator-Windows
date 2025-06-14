use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserProfile {
    pub id: String,
    pub name: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub credits: i32,
    pub plan: UserPlan,
    pub created_at: String,
    pub last_login: String,
    pub stats: UserStats,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserStats {
    pub total_scans: i32,
    pub space_saved: u64,
    pub files_organized: i32,
    pub duplicates_removed: i32,
    pub large_files_found: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum UserPlan {
    Free,
    Pro,
    Enterprise,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferences {
    pub theme: String, // "light", "dark", "system"
    pub language: String,
    pub readability: ReadabilitySettings,
    pub notifications: NotificationSettings,
    pub privacy: PrivacySettings,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadabilitySettings {
    pub text_size: String,    // "small", "normal", "large"
    pub contrast: String,     // "normal", "high"
    pub spacing: String,      // "normal", "wide"
    pub color_filter: String, // "none", "grayscale", "protanopia", "deuteranopia", "tritanopia"
    pub reduce_motion: bool,
    pub high_contrast_mode: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NotificationSettings {
    pub email: bool,
    pub push: bool,
    pub scan_complete: bool,
    pub weekly_report: bool,
    pub tips_and_tricks: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrivacySettings {
    pub share_analytics: bool,
    pub show_profile_public: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreditTransaction {
    pub id: String,
    pub transaction_type: String, // "earned", "spent", "purchased"
    pub amount: i32,
    pub description: String,
    pub date: String,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserCredits {
    pub balance: i32,
    pub history: Vec<CreditTransaction>,
    pub pending: i32,
}

fn get_user_data_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or("Could not get app data directory")?;

    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app directory: {}", e))?;

    Ok(app_dir.join("user_data.json"))
}

fn get_preferences_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or("Could not get app data directory")?;

    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app directory: {}", e))?;

    Ok(app_dir.join("user_preferences.json"))
}

fn get_credits_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or("Could not get app data directory")?;

    fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app directory: {}", e))?;

    Ok(app_dir.join("user_credits.json"))
}

fn create_default_user_profile() -> UserProfile {
    // Get REAL system username
    let username = std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| whoami::username());

    // Get REAL hostname for email
    let hostname = whoami::hostname();
    let email = format!("{}@{}", username, hostname);

    // Get real name if available
    let realname = whoami::realname();
    let display_name = if realname.is_empty() {
        username.clone()
    } else {
        realname
    };

    UserProfile {
        id: format!("user-{}", username),
        name: display_name,
        email,
        avatar_url: None, // No fake avatar
        credits: 0,       // Start with 0 real credits
        plan: UserPlan::Free,
        created_at: chrono::Utc::now().to_rfc3339(),
        last_login: chrono::Utc::now().to_rfc3339(),
        stats: UserStats {
            total_scans: 0,
            space_saved: 0,
            files_organized: 0,
            duplicates_removed: 0,
            large_files_found: 0,
        },
    }
}

fn create_default_preferences() -> UserPreferences {
    UserPreferences {
        theme: "system".to_string(),
        language: "es".to_string(),
        readability: ReadabilitySettings {
            text_size: "normal".to_string(),
            contrast: "normal".to_string(),
            spacing: "normal".to_string(),
            color_filter: "none".to_string(),
            reduce_motion: false,
            high_contrast_mode: false,
        },
        notifications: NotificationSettings {
            email: true,
            push: true,
            scan_complete: true,
            weekly_report: false,
            tips_and_tricks: true,
        },
        privacy: PrivacySettings {
            share_analytics: false,
            show_profile_public: false,
        },
        updated_at: chrono::Utc::now().to_rfc3339(),
    }
}

fn create_default_credits() -> UserCredits {
    UserCredits {
        balance: 0,      // Start with ZERO credits
        history: vec![], // NO fake transactions
        pending: 0,
    }
}

/// Get user profile information
#[tauri::command]
pub async fn get_user_profile(app: AppHandle) -> Result<UserProfile, String> {
    let user_path = get_user_data_path(&app)?;

    if user_path.exists() {
        let content = fs::read_to_string(&user_path)
            .map_err(|e| format!("Failed to read user data: {}", e))?;

        let profile: UserProfile = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse user data: {}", e))?;

        Ok(profile)
    } else {
        // Create default profile
        let profile = create_default_user_profile();
        let content = serde_json::to_string_pretty(&profile)
            .map_err(|e| format!("Failed to serialize user data: {}", e))?;

        fs::write(&user_path, content).map_err(|e| format!("Failed to save user data: {}", e))?;

        Ok(profile)
    }
}

/// Update user preferences
#[tauri::command]
pub async fn update_user_preferences(
    app: AppHandle,
    preferences: UserPreferences,
) -> Result<UserPreferences, String> {
    let prefs_path = get_preferences_path(&app)?;

    let mut updated_prefs = preferences;
    updated_prefs.updated_at = chrono::Utc::now().to_rfc3339();

    let content = serde_json::to_string_pretty(&updated_prefs)
        .map_err(|e| format!("Failed to serialize preferences: {}", e))?;

    fs::write(&prefs_path, content).map_err(|e| format!("Failed to save preferences: {}", e))?;

    Ok(updated_prefs)
}

/// Get user preferences
#[tauri::command]
pub async fn get_user_preferences(app: AppHandle) -> Result<UserPreferences, String> {
    let prefs_path = get_preferences_path(&app)?;

    if prefs_path.exists() {
        let content = fs::read_to_string(&prefs_path)
            .map_err(|e| format!("Failed to read preferences: {}", e))?;

        let preferences: UserPreferences = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse preferences: {}", e))?;

        Ok(preferences)
    } else {
        // Create default preferences
        let preferences = create_default_preferences();
        let content = serde_json::to_string_pretty(&preferences)
            .map_err(|e| format!("Failed to serialize preferences: {}", e))?;

        fs::write(&prefs_path, content)
            .map_err(|e| format!("Failed to save preferences: {}", e))?;

        Ok(preferences)
    }
}

/// Get user credit balance and history
#[tauri::command]
pub async fn get_user_credits(app: AppHandle) -> Result<UserCredits, String> {
    let credits_path = get_credits_path(&app)?;

    if credits_path.exists() {
        let content = fs::read_to_string(&credits_path)
            .map_err(|e| format!("Failed to read credits data: {}", e))?;

        let credits: UserCredits = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse credits data: {}", e))?;

        Ok(credits)
    } else {
        // Create default credits
        let credits = create_default_credits();
        let content = serde_json::to_string_pretty(&credits)
            .map_err(|e| format!("Failed to serialize credits: {}", e))?;

        fs::write(&credits_path, content).map_err(|e| format!("Failed to save credits: {}", e))?;

        Ok(credits)
    }
}

/// Update accessibility settings (subset of preferences)
#[tauri::command]
pub async fn update_accessibility_settings(
    app: AppHandle,
    readability: ReadabilitySettings,
) -> Result<UserPreferences, String> {
    let mut preferences = get_user_preferences(app.clone()).await?;
    preferences.readability = readability;
    update_user_preferences(app, preferences).await
}

/// Add credits to user account
#[tauri::command]
pub async fn add_user_credits(
    app: AppHandle,
    amount: i32,
    description: String,
    transaction_type: String,
) -> Result<UserCredits, String> {
    let mut credits = get_user_credits(app.clone()).await?;

    credits.balance += amount;

    let transaction = CreditTransaction {
        id: format!("txn_{}", chrono::Utc::now().timestamp_millis()),
        transaction_type,
        amount,
        description,
        date: chrono::Utc::now().to_rfc3339(),
        metadata: None,
    };

    credits.history.push(transaction);

    // Save updated credits
    let credits_path = get_credits_path(&app)?;
    let content = serde_json::to_string_pretty(&credits)
        .map_err(|e| format!("Failed to serialize credits: {}", e))?;

    fs::write(&credits_path, content).map_err(|e| format!("Failed to save credits: {}", e))?;

    Ok(credits)
}

/// Spend credits from user account
#[tauri::command]
pub async fn spend_user_credits(
    app: AppHandle,
    amount: i32,
    description: String,
) -> Result<UserCredits, String> {
    let mut credits = get_user_credits(app.clone()).await?;

    if credits.balance < amount {
        return Err("Insufficient credits".to_string());
    }

    credits.balance -= amount;

    let transaction = CreditTransaction {
        id: format!("txn_{}", chrono::Utc::now().timestamp_millis()),
        transaction_type: "spent".to_string(),
        amount: -amount, // Negative to indicate spending
        description,
        date: chrono::Utc::now().to_rfc3339(),
        metadata: None,
    };

    credits.history.push(transaction);

    // Save updated credits
    let credits_path = get_credits_path(&app)?;
    let content = serde_json::to_string_pretty(&credits)
        .map_err(|e| format!("Failed to serialize credits: {}", e))?;

    fs::write(&credits_path, content).map_err(|e| format!("Failed to save credits: {}", e))?;

    Ok(credits)
}

/// Export user data for backup/portability
#[tauri::command]
pub async fn export_user_data(
    app: AppHandle,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let profile = get_user_profile(app.clone()).await?;
    let preferences = get_user_preferences(app.clone()).await?;
    let credits = get_user_credits(app).await?;

    let mut export_data = HashMap::new();

    export_data.insert(
        "profile".to_string(),
        serde_json::to_value(profile).map_err(|e| format!("Failed to serialize profile: {}", e))?,
    );

    export_data.insert(
        "preferences".to_string(),
        serde_json::to_value(preferences)
            .map_err(|e| format!("Failed to serialize preferences: {}", e))?,
    );

    export_data.insert(
        "credits".to_string(),
        serde_json::to_value(credits).map_err(|e| format!("Failed to serialize credits: {}", e))?,
    );

    export_data.insert(
        "export_date".to_string(),
        serde_json::to_value(chrono::Utc::now().to_rfc3339())
            .map_err(|e| format!("Failed to serialize date: {}", e))?,
    );

    Ok(export_data)
}

/// Update user profile stats
#[tauri::command]
pub async fn update_user_stats(app: AppHandle, stats: UserStats) -> Result<UserProfile, String> {
    let mut profile = get_user_profile(app.clone()).await?;
    profile.stats = stats;
    profile.last_login = chrono::Utc::now().to_rfc3339();

    let user_path = get_user_data_path(&app)?;
    let content = serde_json::to_string_pretty(&profile)
        .map_err(|e| format!("Failed to serialize profile: {}", e))?;

    fs::write(&user_path, content).map_err(|e| format!("Failed to save profile: {}", e))?;

    Ok(profile)
}

/// Reset user preferences to defaults
#[tauri::command]
pub async fn reset_user_preferences(app: AppHandle) -> Result<UserPreferences, String> {
    let preferences = create_default_preferences();
    update_user_preferences(app, preferences).await
}
