#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;

mod app_state;
mod commands;
mod disk_analyzer;
mod error;
mod file_system;
mod logging;
mod mft_scanner;
mod websocket;

#[cfg(test)]
mod tests;

use app_state::AppState;
use std::sync::Arc;

fn main() {
    // Inicializar logging antes que nada
    if let Err(e) = logging::init_logging() {
        eprintln!("Failed to initialize logging: {}", e);
    }

    tauri::Builder::default()
        .setup(|app| {
            tracing::info!("Initializing DiskDominator application");

            // Initialize application state within the Tauri context
            let app_state = Arc::new(AppState::new());
            app.manage(app_state.clone());

            // Now we can safely use tokio runtime for initialization
            let app_state_clone = app_state.clone();
            tauri::async_runtime::spawn(async move {
                // Log initial disk detection
                if let Ok(disks) = crate::file_system::get_system_disks().await {
                    let disk_count = disks.len();
                    if disk_count > 0 {
                        crate::commands::home_commands::log_activity(
                            &app_state_clone,
                            format!("{} discos detectados", disk_count),
                            "Sistema listo para análisis".to_string(),
                            crate::commands::home_commands::ActivityType::ScanCompleted,
                            "completed".to_string(),
                            Some(crate::commands::home_commands::ActivityMetadata {
                                size: None,
                                count: Some(disk_count as u32),
                                duration: None,
                                error: None,
                            }),
                        )
                        .await;
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Home and System commands
            commands::home_commands::get_system_overview,
            commands::home_commands::get_recent_activity,
            commands::home_commands::execute_quick_action,
            commands::home_commands::refresh_dashboard,
            // Disk Analyzer commands (new real implementation)
            commands::disk_analyzer_commands::scan_disk_new,
            commands::disk_analyzer_commands::get_scan_progress_new,
            commands::disk_analyzer_commands::get_disk_statuses,
            commands::disk_analyzer_commands::pause_scan,
            commands::disk_analyzer_commands::resume_scan,
            commands::disk_analyzer_commands::cancel_scan,
            // Legacy file commands (keep for compatibility)
            commands::file_commands::get_disk_info,
            commands::file_commands::get_large_files,
            commands::file_commands::find_duplicates,
            commands::file_commands::organize_files,
            commands::file_commands::get_file_metadata,
            commands::file_commands::perform_file_operation,
            commands::file_commands::create_scan_session,
            commands::file_commands::start_scan_session,
            commands::file_commands::pause_scan_session,
            commands::file_commands::resume_scan_session,
            commands::file_commands::cancel_scan_session,
            commands::file_commands::get_scan_session,
            commands::file_commands::get_active_scan_sessions,
            // Duplicate management
            commands::duplicate_commands::find_duplicates_advanced,
            commands::duplicate_commands::get_duplicate_groups,
            commands::duplicate_commands::delete_duplicates_batch,
            commands::duplicate_commands::smart_select_duplicates,
            commands::duplicate_commands::preview_duplicate,
            // Large files management
            commands::large_files_commands::find_large_files,
            commands::large_files_commands::get_file_space_analysis,
            commands::large_files_commands::compress_file,
            commands::large_files_commands::generate_file_preview,
            commands::large_files_commands::delete_large_files_batch,
            // Organization
            commands::organize_commands::analyze_directory_structure,
            commands::organize_commands::create_organization_plan,
            commands::organize_commands::execute_organization_plan,
            commands::organize_commands::preview_organization_changes,
            commands::organize_commands::rollback_organization,
            commands::organize_commands::get_organization_suggestions,
            // User management
            commands::user_commands::get_user_profile,
            commands::user_commands::update_user_preferences,
            commands::user_commands::get_user_preferences,
            commands::user_commands::get_user_credits,
            commands::user_commands::update_accessibility_settings,
            commands::user_commands::add_user_credits,
            commands::user_commands::spend_user_credits,
            commands::user_commands::export_user_data,
            commands::user_commands::update_user_stats,
            commands::user_commands::reset_user_preferences,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
