use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::{AiProvider, AiRequest, AiResponse, AiContext, AiError, FileInfo};

#[derive(Debug, Clone)]
pub struct OpenAIProvider {
    api_key: String,
    model: String,
    base_url: String,
    client: reqwest::Client,
}

#[derive(Debug, Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f32,
    max_tokens: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: Message,
}

impl OpenAIProvider {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            api_key,
            model: model.unwrap_or_else(|| "gpt-3.5-turbo".to_string()),
            base_url: "https://api.openai.com/v1".to_string(),
            client: reqwest::Client::new(),
        }
    }
    
    async fn call_api(&self, messages: Vec<Message>, max_tokens: Option<usize>) -> Result<String, AiError> {
        let request = OpenAIRequest {
            model: self.model.clone(),
            messages,
            temperature: 0.7,
            max_tokens,
        };
        
        let response = self.client
            .post(format!("{}/chat/completions", self.base_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&request)
            .send()
            .await
            .map_err(|e| AiError::ApiError(e.to_string()))?;
        
        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AiError::ApiError(format!("API error: {}", error_text)));
        }
        
        let api_response: OpenAIResponse = response
            .json()
            .await
            .map_err(|e| AiError::ApiError(e.to_string()))?;
        
        api_response
            .choices
            .first()
            .map(|choice| choice.message.content.clone())
            .ok_or_else(|| AiError::ApiError("No response from API".to_string()))
    }
}

#[async_trait]
impl AiProvider for OpenAIProvider {
    async fn complete(&self, request: AiRequest) -> Result<AiResponse, AiError> {
        let system_message = Message {
            role: "system".to_string(),
            content: "You are an AI assistant helping with file organization and disk management.".to_string(),
        };
        
        let user_message = Message {
            role: "user".to_string(),
            content: request.prompt,
        };
        
        let messages = vec![system_message, user_message];
        let content = self.call_api(messages, request.max_tokens).await?;
        
        // Parse suggestions from the response
        let suggestions: Vec<String> = content
            .lines()
            .filter(|line| line.starts_with("- ") || line.starts_with("* "))
            .map(|line| line.trim_start_matches("- ").trim_start_matches("* ").to_string())
            .collect();
        
        Ok(AiResponse {
            content,
            suggestions,
            confidence: 0.85, // Default confidence
        })
    }
    
    async fn suggest_actions(&self, context: AiContext) -> Result<Vec<String>, AiError> {
        let prompt = format!(
            "Based on the following file information, suggest 3-5 actions to organize or optimize the disk:\n{}",
            serde_json::to_string(&context).unwrap_or_default()
        );
        
        let request = AiRequest {
            prompt,
            context: Some(context),
            max_tokens: Some(200),
        };
        
        let response = self.complete(request).await?;
        Ok(response.suggestions)
    }
    
    async fn analyze_duplicates(&self, files: Vec<FileInfo>) -> Result<AiResponse, AiError> {
        let prompt = format!(
            "Analyze these {} duplicate files and suggest which ones to keep:\n{}",
            files.len(),
            files.iter()
                .take(10) // Limit to first 10 for prompt size
                .map(|f| format!("- {} ({})", f.path, f.size))
                .collect::<Vec<_>>()
                .join("\n")
        );
        
        let request = AiRequest {
            prompt,
            context: None,
            max_tokens: Some(300),
        };
        
        self.complete(request).await
    }
}