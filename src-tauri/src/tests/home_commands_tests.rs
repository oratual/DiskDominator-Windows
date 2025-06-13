#[cfg(test)]
mod tests {
    use crate::commands::home_commands::*;
    use crate::app_state::AppState;
    use tauri::State;
    use std::sync::Arc;
    use tokio::sync::RwLock;

    fn create_test_state() -> State<'static, AppState> {
        let app_state = AppState::new();
        State::from(Arc::new(app_state))
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
    fn test_system_summary_calculations() {
        let summary = SystemSummary {
            total_space: 1_000_000_000_000, // 1TB
            used_space: 750_000_000_000,    // 750GB
            free_space: 250_000_000_000,    // 250GB
            total_files: 100_000,
            duplicate_files: 5_000,
            large_files: 500,
            last_scan_date: "2025-06-13".to_string(),
        };
        
        // Verify percentage calculations
        let used_percentage = (summary.used_space as f64 / summary.total_space as f64) * 100.0;
        assert!((used_percentage - 75.0).abs() < 0.01);
        
        // Verify duplicate ratio
        let duplicate_ratio = (summary.duplicate_files as f64 / summary.total_files as f64) * 100.0;
        assert!((duplicate_ratio - 5.0).abs() < 0.01);
    }
}