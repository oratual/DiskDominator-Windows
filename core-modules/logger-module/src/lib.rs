//! Logger module for DiskDominator
//! 
//! Provides logging functionality across the application

use tracing::Level;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

/// Main logger configuration
pub struct LoggerConfig {
    pub level: Level,
    pub file_output: Option<String>,
    pub console_output: bool,
}

impl Default for LoggerConfig {
    fn default() -> Self {
        Self {
            level: Level::INFO,
            file_output: None,
            console_output: true,
        }
    }
}

/// Main logger module for DiskDominator
pub struct LoggerModule;

impl LoggerModule {
    /// Initialize the logger with default configuration
    pub fn init() -> anyhow::Result<()> {
        let config = LoggerConfig::default();
        Self::init_with_config(config)
    }
    
    /// Initialize the logger with the given configuration
    pub fn init_with_config(config: LoggerConfig) -> anyhow::Result<()> {
        let env_filter = tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| format!("{}", config.level))
        );
        
        let fmt_layer = tracing_subscriber::fmt::layer()
            .with_target(false)
            .with_thread_ids(false)
            .with_thread_names(false);
        
        tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt_layer)
            .init();
        
        Ok(())
    }
}

/// Initialize the logger with the given configuration (deprecated, use LoggerModule::init_with_config)
pub fn init_logger(config: LoggerConfig) -> anyhow::Result<()> {
    LoggerModule::init_with_config(config)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = LoggerConfig::default();
        assert_eq!(config.level, Level::INFO);
        assert!(config.console_output);
        assert!(config.file_output.is_none());
    }
}