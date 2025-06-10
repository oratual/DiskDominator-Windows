//! UI Components module for DiskDominator
//! 
//! Shared UI components and utilities for the Tauri frontend

use serde::{Deserialize, Serialize};

/// Theme configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub name: String,
    pub primary_color: String,
    pub secondary_color: String,
    pub background_color: String,
    pub text_color: String,
    pub error_color: String,
    pub success_color: String,
    pub warning_color: String,
}

impl Default for Theme {
    fn default() -> Self {
        Self {
            name: "Default".to_string(),
            primary_color: "#1976d2".to_string(),
            secondary_color: "#dc004e".to_string(),
            background_color: "#ffffff".to_string(),
            text_color: "#000000".to_string(),
            error_color: "#f44336".to_string(),
            success_color: "#4caf50".to_string(),
            warning_color: "#ff9800".to_string(),
        }
    }
}

/// Dark theme preset
impl Theme {
    pub fn dark() -> Self {
        Self {
            name: "Dark".to_string(),
            primary_color: "#90caf9".to_string(),
            secondary_color: "#f48fb1".to_string(),
            background_color: "#121212".to_string(),
            text_color: "#ffffff".to_string(),
            error_color: "#cf6679".to_string(),
            success_color: "#81c784".to_string(),
            warning_color: "#ffb74d".to_string(),
        }
    }
}

/// UI component state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentState {
    pub is_loading: bool,
    pub is_disabled: bool,
    pub is_visible: bool,
    pub error_message: Option<String>,
}

impl Default for ComponentState {
    fn default() -> Self {
        Self {
            is_loading: false,
            is_disabled: false,
            is_visible: true,
            error_message: None,
        }
    }
}

/// Progress indicator data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressData {
    pub current: u64,
    pub total: u64,
    pub message: String,
    pub is_indeterminate: bool,
}

impl ProgressData {
    pub fn percentage(&self) -> f32 {
        if self.total == 0 {
            0.0
        } else {
            (self.current as f32 / self.total as f32) * 100.0
        }
    }
}

/// Toast notification types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ToastType {
    Info,
    Success,
    Warning,
    Error,
}

/// Toast notification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Toast {
    pub id: String,
    pub message: String,
    pub toast_type: ToastType,
    pub duration_ms: u32,
}

impl Toast {
    pub fn info(message: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            message: message.into(),
            toast_type: ToastType::Info,
            duration_ms: 3000,
        }
    }

    pub fn success(message: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            message: message.into(),
            toast_type: ToastType::Success,
            duration_ms: 3000,
        }
    }

    pub fn warning(message: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            message: message.into(),
            toast_type: ToastType::Warning,
            duration_ms: 5000,
        }
    }

    pub fn error(message: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            message: message.into(),
            toast_type: ToastType::Error,
            duration_ms: 5000,
        }
    }
}

/// File size formatter
pub fn format_file_size(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    if unit_index == 0 {
        format!("{} {}", size as u64, UNITS[unit_index])
    } else {
        format!("{:.2} {}", size, UNITS[unit_index])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_file_size() {
        assert_eq!(format_file_size(0), "0 B");
        assert_eq!(format_file_size(1023), "1023 B");
        assert_eq!(format_file_size(1024), "1.00 KB");
        assert_eq!(format_file_size(1536), "1.50 KB");
        assert_eq!(format_file_size(1048576), "1.00 MB");
        assert_eq!(format_file_size(1073741824), "1.00 GB");
    }

    #[test]
    fn test_progress_percentage() {
        let progress = ProgressData {
            current: 50,
            total: 100,
            message: "Processing...".to_string(),
            is_indeterminate: false,
        };
        assert_eq!(progress.percentage(), 50.0);
    }
}