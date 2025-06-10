use std::sync::Arc;
use tokio::sync::RwLock;
use auth_module::AuthModule;
use i18n_module::I18nModule;
use ai_module::AIModule;
use storage_module::StorageModule;
use update_module::UpdateModule;

/// Central application state that holds all core modules
#[derive(Clone)]
pub struct AppState {
    pub auth: Arc<RwLock<AuthModule>>,
    pub i18n: Arc<RwLock<I18nModule>>,
    pub ai: Arc<RwLock<AIModule>>,
    pub storage: Arc<RwLock<StorageModule>>,
    pub updater: Arc<RwLock<UpdateModule>>,
}

impl AppState {
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
}