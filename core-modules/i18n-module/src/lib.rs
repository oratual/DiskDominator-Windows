//! Internationalization (i18n) module for DiskDominator
//! 
//! Provides multi-language support and localization functionality

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum I18nError {
    #[error("Language not found: {0}")]
    LanguageNotFound(String),
    #[error("Translation key not found: {0}")]
    KeyNotFound(String),
    #[error("Failed to load translations: {0}")]
    LoadError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Language {
    pub code: String,
    pub name: String,
    pub native_name: String,
}

/// Translation storage for a specific language
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Translations {
    pub messages: HashMap<String, String>,
}

/// Main i18n manager
pub struct I18nManager {
    current_language: String,
    translations: HashMap<String, Translations>,
    fallback_language: String,
}

/// Main I18n module for DiskDominator (alias for I18nManager)
pub struct I18nModule {
    manager: I18nManager,
}

impl I18nManager {
    pub fn new(default_language: &str) -> Self {
        Self {
            current_language: default_language.to_string(),
            translations: HashMap::new(),
            fallback_language: "en".to_string(),
        }
    }

    /// Load translations for a specific language
    pub fn load_language(&mut self, language: Language, translations: Translations) {
        self.translations.insert(language.code, translations);
    }

    /// Set the current active language
    pub fn set_language(&mut self, language_code: &str) -> Result<(), I18nError> {
        if self.translations.contains_key(language_code) {
            self.current_language = language_code.to_string();
            Ok(())
        } else {
            Err(I18nError::LanguageNotFound(language_code.to_string()))
        }
    }

    /// Get a translated message by key
    pub fn get(&self, key: &str) -> Result<String, I18nError> {
        // Try current language first
        if let Some(translations) = self.translations.get(&self.current_language) {
            if let Some(message) = translations.messages.get(key) {
                return Ok(message.clone());
            }
        }

        // Try fallback language
        if let Some(translations) = self.translations.get(&self.fallback_language) {
            if let Some(message) = translations.messages.get(key) {
                return Ok(message.clone());
            }
        }

        Err(I18nError::KeyNotFound(key.to_string()))
    }

    /// Get current language code
    pub fn current_language(&self) -> &str {
        &self.current_language
    }
}

impl I18nModule {
    pub fn new(language: &str) -> Self {
        let mut manager = I18nManager::new(language);
        
        // Load default English translations
        let mut en_translations = Translations::default();
        en_translations.messages.insert("app.title".to_string(), "DiskDominator".to_string());
        en_translations.messages.insert("menu.file".to_string(), "File".to_string());
        en_translations.messages.insert("menu.edit".to_string(), "Edit".to_string());
        en_translations.messages.insert("menu.view".to_string(), "View".to_string());
        en_translations.messages.insert("menu.help".to_string(), "Help".to_string());
        
        manager.load_language(
            Language {
                code: "en".to_string(),
                name: "English".to_string(),
                native_name: "English".to_string(),
            },
            en_translations,
        );
        
        // Set the requested language if it's not English
        if language != "en" && language != "en-US" {
            let _ = manager.set_language(language);
        }
        
        Self { manager }
    }
    
    pub fn get(&self, key: &str) -> String {
        self.manager.get(key).unwrap_or_else(|_| key.to_string())
    }
    
    pub fn set_language(&mut self, language: &str) -> Result<(), I18nError> {
        self.manager.set_language(language)
    }
    
    pub fn current_language(&self) -> &str {
        self.manager.current_language()
    }
}

/// Helper macro for easy translation access
#[macro_export]
macro_rules! t {
    ($manager:expr, $key:expr) => {
        $manager.get($key).unwrap_or_else(|_| $key.to_string())
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_i18n_manager() {
        let mut manager = I18nManager::new("en");
        
        let mut en_translations = Translations::default();
        en_translations.messages.insert("hello".to_string(), "Hello".to_string());
        
        manager.load_language(
            Language {
                code: "en".to_string(),
                name: "English".to_string(),
                native_name: "English".to_string(),
            },
            en_translations,
        );

        assert_eq!(manager.get("hello").unwrap(), "Hello");
        assert!(manager.get("unknown").is_err());
    }
}