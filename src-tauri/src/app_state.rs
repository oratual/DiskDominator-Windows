// Temporarily simplified AppState until external modules are available
use std::sync::Arc;
use tokio::sync::RwLock;

// Commented out until modules are available:
// use auth_module::AuthModule;
// use i18n_module::I18nModule;
// use ai_module::AIModule;
// use storage_module::StorageModule;
// use update_module::UpdateModule;

/// Simplified storage struct for basic functionality
#[derive(Default)]
pub struct SimpleStorage {
    // Basic in-memory storage for file scan results
    pub scan_results: std::collections::HashMap<String, Vec<crate::file_system::FileInfo>>,
}

/// Central application state - simplified version
#[derive(Clone)]
pub struct AppState {
    pub storage: Arc<RwLock<SimpleStorage>>,
    pub current_analyzer: Arc<RwLock<Option<crate::disk_analyzer::DiskAnalyzer>>>,
    pub websocket_manager: Arc<crate::websocket::WebSocketManager>,
    pub activity_log: Arc<RwLock<std::collections::HashMap<String, crate::commands::home_commands::Activity>>>,
    // Commented out until modules are available:
    // pub auth: Arc<RwLock<AuthModule>>,
    // pub i18n: Arc<RwLock<I18nModule>>,
    // pub ai: Arc<RwLock<AIModule>>,
    // pub updater: Arc<RwLock<UpdateModule>>,
}

impl AppState {
    pub fn new() -> Self {
        let websocket_manager = Arc::new(crate::websocket::WebSocketManager::new());
        let app_state = Self {
            storage: Arc::new(RwLock::new(SimpleStorage::default())),
            current_analyzer: Arc::new(RwLock::new(None)),
            websocket_manager,
            activity_log: Arc::new(RwLock::new(std::collections::HashMap::new())),
        };
        
        // Initialize with some sample activities for demo purposes
        tokio::spawn({
            let state = app_state.clone();
            async move {
                state.initialize_sample_activities().await;
            }
        });
        
        app_state
    }
    
    /// Add activity to the log
    pub async fn add_activity(&self, activity: crate::commands::home_commands::Activity) {
        let mut log = self.activity_log.write().await;
        log.insert(activity.id.clone(), activity);
        
        // Keep only last 100 activities
        if log.len() > 100 {
            let mut activities: Vec<_> = log.values().cloned().collect();
            activities.sort_by(|a, b| b.time.cmp(&a.time));
            log.clear();
            for activity in activities.into_iter().take(100) {
                log.insert(activity.id.clone(), activity);
            }
        }
    }
    
    /// Initialize sample activities for demo purposes
    async fn initialize_sample_activities(&self) {
        use crate::commands::home_commands::{Activity, ActivityType, ActivityMetadata};
        use chrono::{Utc, Duration};
        use uuid::Uuid;

        let sample_activities = vec![
            Activity {
                id: Uuid::new_v4().to_string(),
                action: "Bienvenido a DiskDominator".to_string(),
                target: "Sistema iniciado".to_string(),
                time: Utc::now(),
                activity_type: ActivityType::ScanStarted,
                status: "completed".to_string(),
                metadata: None,
            },
            Activity {
                id: Uuid::new_v4().to_string(),
                action: "Discos del sistema detectados".to_string(),
                target: "Detección automática completada".to_string(),
                time: Utc::now() - Duration::seconds(30),
                activity_type: ActivityType::ScanCompleted,
                status: "completed".to_string(),
                metadata: Some(ActivityMetadata {
                    size: None,
                    count: Some(4), // 4 discos detectados
                    duration: Some(2),
                    error: None,
                }),
            },
            Activity {
                id: Uuid::new_v4().to_string(),
                action: "Sistema listo para uso".to_string(),
                target: "Todas las funcionalidades disponibles".to_string(),
                time: Utc::now() - Duration::seconds(10),
                activity_type: ActivityType::ScanCompleted,
                status: "ready".to_string(),
                metadata: None,
            },
        ];

        for activity in sample_activities {
            self.add_activity(activity).await;
        }
    }
    
    // Original constructor commented out:
    /*
    pub fn new(
        auth: AuthModule,
        i18n: I18nModule,
        ai: AIModule,
        storage: StorageModule,
        updater: UpdateModule,
    ) -> Self {
        Self {
            auth: Arc::new(RwLock::new(auth)),
            i18n: Arc::new(RwLock::new(i18n)),
            ai: Arc::new(RwLock::new(ai)),
            storage: Arc::new(RwLock::new(storage)),
            updater: Arc::new(RwLock::new(updater)),
        }
    }
    */
}