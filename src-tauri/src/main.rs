#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use anyhow::Result;
use tauri::Manager;
use tracing::{info, error};

// Import our core modules
use logger_module::LoggerModule;
use auth_module::{AuthModule, AuthConfig};
use i18n_module::I18nModule;
use ai_module::{AIModule, AIConfig};
use storage_module::StorageModule;
use update_module::UpdateModule;

mod commands;
mod file_system;
mod disk_analyzer;
mod app_state;
mod events;

use app_state::AppState;

fn main() {
    // Initialize logger
    LoggerModule::init().expect("Failed to initialize logger");
    
    info!("Starting DiskDominator Suite Application");
    
    tauri::Builder::default()
        .setup(|app| {
            info!("Setting up application modules");
            
            // Initialize core modules
            let auth = AuthModule::new(AuthConfig::default());
            let i18n = I18nModule::new("en-US");
            let ai = AIModule::new(AIConfig::default())?;
            let storage = StorageModule::new(app.path_resolver().app_data_dir().unwrap())?;
            let updater = UpdateModule::new("stable");
            
            // Create app state
            let state = AppState::new(auth, i18n, ai, storage, updater);
            
            // Manage app state
            app.manage(state);
            
            info!("Application setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // File system commands
            commands::scan_disk,
            commands::get_disk_info,
            commands::get_large_files,
            commands::find_duplicates,
            commands::organize_files,
            commands::get_file_metadata,
            commands::perform_file_operation,
            
            // Module commands
            commands::auth_login,
            commands::auth_logout,
            commands::set_language,
            commands::ai_analyze,
            commands::check_updates,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
pub use logger_module::LoggerModule;
pub use auth_module::{AuthModule, AuthConfig};
