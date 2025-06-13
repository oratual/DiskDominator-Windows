#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// use tauri::Manager; // Not needed for current setup"

mod commands;
mod file_system;
mod disk_analyzer;
mod app_state;
mod websocket;

use app_state::AppState;

fn main() {
    // Initialize application state
    let app_state = AppState::new();
    
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::file_commands::scan_disk,
            commands::file_commands::get_scan_progress,
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
            commands::home_commands::get_system_overview,
            commands::home_commands::get_recent_activity,
            commands::home_commands::execute_quick_action,
            commands::home_commands::refresh_dashboard,
            commands::duplicate_commands::find_duplicates_advanced,
            commands::duplicate_commands::get_duplicate_groups,
            commands::duplicate_commands::delete_duplicates_batch,
            commands::duplicate_commands::smart_select_duplicates,
            commands::duplicate_commands::preview_duplicate,
            commands::large_files_commands::find_large_files,
            commands::large_files_commands::get_file_space_analysis,
            commands::large_files_commands::compress_file,
            commands::large_files_commands::generate_file_preview,
            commands::large_files_commands::delete_large_files_batch,
            commands::organize_commands::analyze_directory_structure,
            commands::organize_commands::create_organization_plan,
            commands::organize_commands::execute_organization_plan,
            commands::organize_commands::preview_organization_changes,
            commands::organize_commands::rollback_organization,
            commands::organize_commands::get_organization_suggestions,
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