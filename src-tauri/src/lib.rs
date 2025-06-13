// Library exports for testing and external use

pub mod app_state;
pub mod commands;
pub mod disk_analyzer;
pub mod file_system;
pub mod mft_scanner;
pub mod websocket;

#[cfg(test)]
pub mod tests;

// Re-export commonly used types for easier access in tests
pub use app_state::AppState;
pub use disk_analyzer::{DiskAnalyzer, ScanConfig, ScanType, DuplicateStrategy};
pub use file_system::FileInfo;
pub use websocket::WebSocketManager;