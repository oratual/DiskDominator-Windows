//! AI Assistant module for DiskDominator
//! 
//! Provides AI-powered assistance for file management tasks

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

pub mod providers;
use providers::{OpenAIProvider, ClaudeProvider, OllamaProvider};

#[derive(Debug, Error)]
pub enum AiError {
    #[error("AI service unavailable")]
    ServiceUnavailable,
    #[error("Invalid request: {0}")]
    InvalidRequest(String),
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
    #[error("API error: {0}")]
    ApiError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiRequest {
    pub prompt: String,
    pub context: Option<AiContext>,
    pub max_tokens: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiContext {
    pub file_info: Option<FileInfo>,
    pub user_preferences: Option<UserPreferences>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub size: u64,
    pub file_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreferences {
    pub language: String,
    pub expertise_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiResponse {
    pub content: String,
    pub suggestions: Vec<String>,
    pub confidence: f32,
}

// Types that would come from the main application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizeRules {
    pub by_extension: bool,
    pub by_date: bool,
    pub by_size: bool,
    pub custom_rules: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAnalysisResponse {
    pub suggestions: Vec<String>,
    pub categories: Vec<FileCategory>,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileCategory {
    pub name: String,
    pub files: Vec<String>,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileOperation {
    pub operation: String,
    pub source: String,
    pub destination: Option<String>,
}

/// Main AI Module for DiskDominator
pub struct AIModule {
    provider: Box<dyn AiProvider>,
    config: AIConfig,
}

impl AIModule {
    pub fn new(config: AIConfig) -> Result<Self, AiError> {
        let provider: Box<dyn AiProvider> = match config.provider {
            AIProviderType::OpenAI => {
                let api_key = config.api_key.as_ref()
                    .ok_or_else(|| AiError::InvalidRequest("OpenAI API key required".into()))?;
                Box::new(OpenAIProvider::new(api_key.clone(), config.model.clone()))
            }
            AIProviderType::Claude => {
                let api_key = config.api_key.as_ref()
                    .ok_or_else(|| AiError::InvalidRequest("Claude API key required".into()))?;
                Box::new(ClaudeProvider::new(api_key.clone(), config.model.clone()))
            }
            AIProviderType::Ollama => {
                Box::new(OllamaProvider::new(config.model.clone(), config.ollama_url.clone()))
            }
            AIProviderType::Mock => {
                Box::new(MockAiProvider)
            }
        };
        
        Ok(Self { provider, config })
    }
    
    pub async fn categorize_files(&self, path: &str) -> Result<AIAnalysisResponse, AiError> {
        // Simplified categorization logic
        Ok(AIAnalysisResponse {
            suggestions: vec![
                "Group similar file types together".to_string(),
                "Create folders by date".to_string(),
            ],
            categories: vec![
                FileCategory {
                    name: "Documents".to_string(),
                    files: vec![],
                    reason: "Text and office files".to_string(),
                },
                FileCategory {
                    name: "Media".to_string(),
                    files: vec![],
                    reason: "Images, videos, and audio".to_string(),
                },
            ],
            confidence: 0.85,
        })
    }
    
    pub async fn suggest_cleanup(&self, path: &str) -> Result<AIAnalysisResponse, AiError> {
        Ok(AIAnalysisResponse {
            suggestions: vec![
                "Delete temporary files older than 30 days".to_string(),
                "Remove empty directories".to_string(),
                "Archive large files not accessed in 6 months".to_string(),
            ],
            categories: vec![],
            confidence: 0.90,
        })
    }
    
    pub async fn identify_important_files(&self, path: &str) -> Result<AIAnalysisResponse, AiError> {
        Ok(AIAnalysisResponse {
            suggestions: vec![
                "Backup these critical files".to_string(),
                "Consider version control for documents".to_string(),
            ],
            categories: vec![
                FileCategory {
                    name: "Critical".to_string(),
                    files: vec![],
                    reason: "System and configuration files".to_string(),
                },
            ],
            confidence: 0.75,
        })
    }
    
    pub async fn suggest_organization(&self, path: &str, rules: &OrganizeRules) -> Result<Vec<FileOperation>, AiError> {
        // Generate file operations based on rules
        Ok(vec![])
    }
}

#[async_trait]
pub trait AiProvider: Send + Sync {
    async fn complete(&self, request: AiRequest) -> Result<AiResponse, AiError>;
    async fn suggest_actions(&self, context: AiContext) -> Result<Vec<String>, AiError>;
    async fn analyze_duplicates(&self, files: Vec<FileInfo>) -> Result<AiResponse, AiError>;
}

/// Mock AI provider for testing
pub struct MockAiProvider;

#[async_trait]
impl AiProvider for MockAiProvider {
    async fn complete(&self, request: AiRequest) -> Result<AiResponse, AiError> {
        Ok(AiResponse {
            content: format!("Mock response for: {}", request.prompt),
            suggestions: vec!["Delete duplicates".to_string(), "Archive old files".to_string()],
            confidence: 0.95,
        })
    }

    async fn suggest_actions(&self, _context: AiContext) -> Result<Vec<String>, AiError> {
        Ok(vec![
            "Clean temporary files".to_string(),
            "Organize by date".to_string(),
            "Compress large files".to_string(),
        ])
    }

    async fn analyze_duplicates(&self, files: Vec<FileInfo>) -> Result<AiResponse, AiError> {
        Ok(AiResponse {
            content: format!("Found {} potential duplicates", files.len()),
            suggestions: vec!["Keep newest versions".to_string()],
            confidence: 0.85,
        })
    }
}

/// Configuration for AI module
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub provider: AIProviderType,
    pub api_key: Option<String>,
    pub model: Option<String>,
    pub temperature: f32,
    pub max_retries: usize,
    pub ollama_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AIProviderType {
    OpenAI,
    Claude,
    Ollama,
    Mock,
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            provider: AIProviderType::Mock,
            api_key: None,
            model: None,
            temperature: 0.7,
            max_retries: 3,
            ollama_url: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mock_ai_provider() {
        let provider = MockAiProvider;
        let request = AiRequest {
            prompt: "Help me organize my files".to_string(),
            context: None,
            max_tokens: None,
        };
        
        let response = provider.complete(request).await.unwrap();
        assert!(response.content.contains("Mock response"));
        assert_eq!(response.confidence, 0.95);
    }
}