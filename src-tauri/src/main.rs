#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// use tauri::Manager; // Not needed for current setup"

mod commands;
mod file_system;
mod disk_analyzer;
mod app_state;

use app_state::AppState;

fn main() {
    // Initialize application state
    let app_state = AppState::new();
    
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::file_commands::scan_disk,
            commands::file_commands::get_disk_info,
            commands::file_commands::get_large_files,
            commands::file_commands::find_duplicates,
            commands::file_commands::organize_files,
            commands::file_commands::get_file_metadata,
            commands::file_commands::perform_file_operation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}