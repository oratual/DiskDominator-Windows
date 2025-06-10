use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::{AiProvider, AiRequest, AiResponse, AiContext, AiError, FileInfo};

#[derive(Debug, Clone)]
pub struct OllamaProvider {
    model: String,
    base_url: String,
    client: reqwest::Client,
}

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: OllamaOptions,
}

#[derive(Debug, Serialize)]
struct OllamaOptions {
    temperature: f32,
    num_predict: Option<usize>,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
    done: bool,
}

impl OllamaProvider {
    pub fn new(model: Option<String>, base_url: Option<String>) -> Self {
        Self {
            model: model.unwrap_or_else(|| "llama2".to_string()),
            base_url: base_url.unwrap_or_else(|| "http://localhost:11434".to_string()),
            client: reqwest::Client::new(),
        }
    }
    
    pub async fn check_availability(&self) -> Result<bool, AiError> {
        let response = self.client
            .get(format!("{}/api/tags", self.base_url))
            .send()
            .await;
        
        match response {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(_) => Ok(false),
        }
    }
    
    async fn call_api(&self, prompt: String, max_tokens: Option<usize>) -> Result<String, AiError> {
        let request = OllamaRequest {
            model: self.model.clone(),
            prompt,
            stream: false,
            options: OllamaOptions {
                temperature: 0.7,
                num_predict: max_tokens,
            },
        };
        
        let response = self.client
            .post(format!("{}/api/generate", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| AiError::ApiError(format!("Ollama connection error: {}", e)))?;
        
        if !response.status().is_success() {
            return Err(AiError::ServiceUnavailable);
        }
        
        let api_response: OllamaResponse = response
            .json()
            .await
            .map_err(|e| AiError::ApiError(e.to_string()))?;
        
        Ok(api_response.response)
    }
}

#[async_trait]
impl AiProvider for OllamaProvider {
    async fn complete(&self, request: AiRequest) -> Result<AiResponse, AiError> {
        // Check if Ollama is available
        if !self.check_availability().await? {
            return Err(AiError::ServiceUnavailable);
        }
        
        let system_context = "You are an AI assistant helping with file organization and disk management. \
                             Provide practical suggestions in a bulleted list format.";
        
        let full_prompt = format!("{}\n\n{}", system_context, request.prompt);
        let content = self.call_api(full_prompt, request.max_tokens).await?;
        
        // Parse suggestions from the response
        let suggestions: Vec<String> = content
            .lines()
            .filter(|line| {
                let trimmed = line.trim();
                trimmed.starts_with("- ") || 
                trimmed.starts_with("* ") || 
                trimmed.starts_with("• ") ||
                (trimmed.len() > 2 && trimmed.chars().nth(0).map_or(false, |c| c.is_digit(10)))
            })
            .map(|line| {
                line.trim()
                    .trim_start_matches(|c: char| c.is_digit(10) || c == '.' || c == '-' || c == '*' || c == '•')
                    .trim()
                    .to_string()
            })
            .filter(|s| !s.is_empty())
            .collect();
        
        Ok(AiResponse {
            content,
            suggestions,
            confidence: 0.75, // Local models typically have lower confidence
        })
    }
    
    async fn suggest_actions(&self, context: AiContext) -> Result<Vec<String>, AiError> {
        let prompt = format!(
            "Based on this file system information, provide 3-5 specific actions to organize files better:\n\
            - Current path: {}\n\
            - User preference: {}\n\
            Provide each suggestion as a bullet point.",
            context.file_info.as_ref().map(|f| &f.path).unwrap_or(&"Unknown".to_string()),
            context.user_preferences.as_ref()
                .map(|p| &p.language)
                .unwrap_or(&"en".to_string())
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
        if files.is_empty() {
            return Ok(AiResponse {
                content: "No duplicate files to analyze.".to_string(),
                suggestions: vec![],
                confidence: 1.0,
            });
        }
        
        let prompt = format!(
            "Analyze these {} duplicate files and suggest which ones to keep. \
            Consider file location, naming, and size. List your recommendations:\n{}",
            files.len(),
            files.iter()
                .take(10)
                .enumerate()
                .map(|(i, f)| format!("{}. {} ({})", i + 1, f.path, f.size))
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