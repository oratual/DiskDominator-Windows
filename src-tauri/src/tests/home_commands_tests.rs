#[cfg(test)]
mod tests {
    use crate::commands::home_commands::*;
    use crate::app_state::AppState;
    use tauri::State;
    use std::sync::Arc;

    fn create_test_state() -> State<'static, Arc<AppState>> {
        let app_state = Arc::new(AppState::new());
        State::from(app_state)
    }

    #[tokio::test]
    async fn test_get_system_overview() {
        let state = create_test_state();
        let result = get_system_overview(state).await;
        
        assert!(result.is_ok());
        let overview = result.unwrap();
        
        // Verify structure
        assert!(!overview.disks.is_empty());
        assert!(!overview.summary.last_scan_date.is_empty());
        assert!(overview.summary.total_space > 0);
    }

    #[tokio::test]
    async fn test_get_recent_activity() {
        let state = create_test_state();
        
        // Test with default limit
        let result = get_recent_activity(None, state.clone()).await;
        assert!(result.is_ok());
        let activities = result.unwrap();
        assert!(activities.len() <= 50); // Default limit
        
        // Test with custom limit
        let result = get_recent_activity(Some(10), state).await;
        assert!(result.is_ok());
        let activities = result.unwrap();
        assert!(activities.len() <= 10);
    }

    #[tokio::test]
    async fn test_execute_quick_action() {
        let state = create_test_state();
        
        // Test various action types
        let actions = vec!["scan", "duplicates", "large_files", "organize"];
        
        for action in actions {
            let result = execute_quick_action(action.to_string(), state.clone()).await;
            assert!(result.is_ok());
            assert!(result.unwrap());
        }
        
        // Test invalid action
        let result = execute_quick_action("invalid_action".to_string(), state).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_refresh_dashboard() {
        let state = create_test_state();
        let result = refresh_dashboard(state).await;
        
        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_disk_summary_calculations() {
        let disk = DiskSummary {
            id: "test-disk".to_string(),
            label: "Test Disk".to_string(),
            path: "C:\\".to_string(),
            total: 1_000_000_000_000, // 1TB
            used: 750_000_000_000,    // 750GB
            free: 250_000_000_000,    // 250GB
            percentage: 75.0,
            file_system: Some("NTFS".to_string()),
            last_scanned: None,
        };
        
        // Verify percentage calculations
        let calculated_percentage = (disk.used as f64 / disk.total as f64) * 100.0;
        assert!((calculated_percentage - disk.percentage as f64).abs() < 0.01);
        
        // Verify space calculations
        assert_eq!(disk.used + disk.free, disk.total);
    }
}