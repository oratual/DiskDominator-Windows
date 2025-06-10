use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::{AiProvider, AiRequest, AiResponse, AiContext, AiError, FileInfo};

#[derive(Debug, Clone)]
pub struct ClaudeProvider {
    api_key: String,
    model: String,
    base_url: String,
    client: reqwest::Client,
}

#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    messages: Vec<ClaudeMessage>,
    max_tokens: usize,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    content: Vec<Content>,
}

#[derive(Debug, Deserialize)]
struct Content {
    text: String,
}

impl ClaudeProvider {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            api_key,
            model: model.unwrap_or_else(|| "claude-3-sonnet-20240229".to_string()),
            base_url: "https://api.anthropic.com/v1".to_string(),
            client: reqwest::Client::new(),
        }
    }
    
    async fn call_api(&self, messages: Vec<ClaudeMessage>, max_tokens: usize) -> Result<String, AiError> {
        let request = ClaudeRequest {
            model: self.model.clone(),
            messages,
            max_tokens,
            temperature: 0.7,
        };
        
        let response = self.client
            .post(format!("{}/messages", self.base_url))
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| AiError::ApiError(e.to_string()))?;
        
        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AiError::ApiError(format!("Claude API error: {}", error_text)));
        }
        
        let api_response: ClaudeResponse = response
            .json()
            .await
            .map_err(|e| AiError::ApiError(e.to_string()))?;
        
        api_response
            .content
            .first()
            .map(|c| c.text.clone())
            .ok_or_else(|| AiError::ApiError("No response from Claude API".to_string()))
    }
}

#[async_trait]
impl AiProvider for ClaudeProvider {
    async fn complete(&self, request: AiRequest) -> Result<AiResponse, AiError> {
        let system_prompt = "You are Claude, an AI assistant specialized in file organization and disk management. \
                            Provide clear, actionable suggestions for organizing files and optimizing disk space.";
        
        let full_prompt = format!("{}\n\nUser: {}\n\nAssistant:", system_prompt, request.prompt);
        
        let message = ClaudeMessage {
            role: "user".to_string(),
            content: full_prompt,
        };
        
        let content = self.call_api(vec![message], request.max_tokens.unwrap_or(300)).await?;
        
        // Parse suggestions from the response
        let suggestions: Vec<String> = content
            .lines()
            .filter(|line| line.starts_with("• ") || line.starts_with("- ") || line.starts_with("* "))
            .map(|line| {
                line.trim_start_matches("• ")
                    .trim_start_matches("- ")
                    .trim_start_matches("* ")
                    .to_string()
            })
            .collect();
        
        Ok(AiResponse {
            content,
            suggestions,
            confidence: 0.90, // Claude typically has high confidence
        })
    }
    
    async fn suggest_actions(&self, context: AiContext) -> Result<Vec<String>, AiError> {
        let prompt = format!(
            "Analyze this file system context and suggest 3-5 specific actions to optimize disk usage:\n\n{}",
            serde_json::to_string_pretty(&context).unwrap_or_default()
        );
        
        let request = AiRequest {
            prompt,
            context: Some(context),
            max_tokens: Some(250),
        };
        
        let response = self.complete(request).await?;
        Ok(response.suggestions)
    }
    
    async fn analyze_duplicates(&self, files: Vec<FileInfo>) -> Result<AiResponse, AiError> {
        let file_list = files.iter()
            .take(15) // Claude can handle more context
            .map(|f| format!("- {} (size: {}, type: {})", 
                f.path, 
                f.size, 
                f.file_type
            ))
            .collect::<Vec<_>>()
            .join("\n");
        
        let prompt = format!(
            "I have {} duplicate files. Please analyze them and suggest which to keep based on:\n\
            1. File location (prefer organized locations)\n\
            2. File naming (prefer descriptive names)\n\
            3. Modification date (prefer newer or older based on context)\n\n\
            Files:\n{}",
            files.len(),
            file_list
        );
        
        let request = AiRequest {
            prompt,
            context: None,
            max_tokens: Some(400),
        };
        
        self.complete(request).await
    }
}