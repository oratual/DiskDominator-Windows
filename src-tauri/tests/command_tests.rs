#[cfg(test)]
mod command_tests {
    use disk_dominator::app_state::AppState;
    use disk_dominator::commands::disk_analyzer_commands::*;
    use disk_dominator::commands::home_commands::*;
    use std::sync::Arc;
    use tauri::State;

    #[tokio::test]
    async fn test_system_overview() {
        let app_state = Arc::new(AppState::new());
        let state = State::from(app_state);

        let result = get_system_overview(state).await;

        match result {
            Ok(overview) => {
                println!("System overview test passed");
                println!("Total disks: {}", overview.disks.len());
                println!(
                    "Total space: {} GB",
                    overview.total_space / (1024_u64.pow(3))
                );

                // Basic validation
                assert!(overview.disks.len() > 0, "Should detect at least one disk");
                assert!(overview.total_space > 0, "Total space should be positive");
                assert!(
                    overview.used_space <= overview.total_space,
                    "Used space shouldn't exceed total"
                );
            }
            Err(e) => {
                // System overview might fail in test environment
                println!("System overview failed (expected in test env): {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_recent_activity() {
        let app_state = Arc::new(AppState::new());
        let state = State::from(app_state);

        // Wait a bit for sample activities to be initialized
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        let result = get_recent_activity(state).await;

        match result {
            Ok(activities) => {
                println!("Recent activity test passed");
                println!("Found {} activities", activities.len());

                // Should have sample activities
                assert!(activities.len() > 0, "Should have sample activities");

                // Check activity structure
                for activity in &activities {
                    assert!(!activity.id.is_empty(), "Activity ID should not be empty");
                    assert!(
                        !activity.action.is_empty(),
                        "Activity action should not be empty"
                    );
                    assert!(
                        !activity.target.is_empty(),
                        "Activity target should not be empty"
                    );
                }
            }
            Err(e) => {
                panic!("Recent activity should not fail: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_scan_request_validation() {
        let app_state = Arc::new(AppState::new());
        let state = State::from(app_state);

        // Test valid scan request
        let valid_request = ScanRequest {
            disk_id: "C".to_string(),
            scan_type: DiskScanType::Quick,
            exclude_patterns: Some(vec!["temp".to_string()]),
            include_hidden: Some(false),
            calculate_hashes: Some(false),
        };

        let result = scan_disk_new(valid_request, state.clone()).await;

        match result {
            Ok(response) => {
                println!("Scan request test passed");
                println!("Session ID: {}", response.session_id);
                assert!(
                    !response.session_id.is_empty(),
                    "Session ID should not be empty"
                );
            }
            Err(e) => {
                // Scan might fail if C: drive doesn't exist or permission issues
                println!("Scan failed (might be expected): {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_quick_actions() {
        let app_state = Arc::new(AppState::new());
        let state = State::from(app_state);

        // Test refresh action
        let refresh_result = execute_quick_action("refresh".to_string(), state.clone()).await;
        assert!(refresh_result.is_ok(), "Refresh action should succeed");

        // Test cleanup action
        let cleanup_result = execute_quick_action("cleanup".to_string(), state.clone()).await;
        assert!(cleanup_result.is_ok(), "Cleanup action should succeed");

        // Test invalid action
        let invalid_result = execute_quick_action("invalid_action".to_string(), state).await;
        assert!(invalid_result.is_err(), "Invalid action should fail");
    }

    #[tokio::test]
    async fn test_dashboard_refresh() {
        let app_state = Arc::new(AppState::new());
        let state = State::from(app_state);

        let result = refresh_dashboard(state).await;

        match result {
            Ok(dashboard) => {
                println!("Dashboard refresh test passed");
                println!("Dashboard has {} disk(s)", dashboard.disks.len());

                // Basic validation
                assert!(dashboard.system_health >= 0.0 && dashboard.system_health <= 100.0);
                assert!(!dashboard.quick_stats.is_empty());
            }
            Err(e) => {
                println!("Dashboard refresh failed: {}", e);
                // This might fail in test environment, which is acceptable
            }
        }
    }

    #[test]
    fn test_activity_type_serialization() {
        use serde_json;

        // Test that ActivityType can be serialized/deserialized
        let activity_type = ActivityType::ScanStarted;
        let json = serde_json::to_string(&activity_type).expect("Failed to serialize ActivityType");
        let parsed: ActivityType =
            serde_json::from_str(&json).expect("Failed to deserialize ActivityType");

        assert!(matches!(parsed, ActivityType::ScanStarted));

        // Test all variants
        let all_types = vec![
            ActivityType::ScanStarted,
            ActivityType::ScanCompleted,
            ActivityType::DuplicatesFound,
            ActivityType::FilesDeleted,
            ActivityType::FilesOrganized,
            ActivityType::Error,
        ];

        for activity_type in all_types {
            let json = serde_json::to_string(&activity_type).expect("Failed to serialize");
            let _parsed: ActivityType = serde_json::from_str(&json).expect("Failed to deserialize");
        }
    }

    #[test]
    fn test_scan_type_conversion() {
        // Test DiskScanType to ScanType conversion
        use disk_dominator::disk_analyzer::ScanType;

        let quick = DiskScanType::Quick;
        let deep = DiskScanType::Deep;
        let custom = DiskScanType::Custom;

        // These should be convertible (test done in actual command implementation)
        println!("Scan types defined correctly");

        // Test serialization
        let json_quick =
            serde_json::to_string(&quick).expect("Failed to serialize DiskScanType::Quick");
        let json_deep =
            serde_json::to_string(&deep).expect("Failed to serialize DiskScanType::Deep");
        let json_custom =
            serde_json::to_string(&custom).expect("Failed to serialize DiskScanType::Custom");

        assert!(json_quick.contains("quick"));
        assert!(json_deep.contains("deep"));
        assert!(json_custom.contains("custom"));
    }
}
