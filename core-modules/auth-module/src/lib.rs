//! Authentication module for DiskDominator
//! 
//! Handles user authentication, authorization, and session management

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("Session expired")]
    SessionExpired,
    #[error("Unauthorized access")]
    Unauthorized,
    #[error("Internal error: {0}")]
    Internal(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: Option<String>,
    pub roles: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credentials {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub user_id: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

#[async_trait]
pub trait AuthProvider: Send + Sync {
    async fn authenticate(&self, username: &str, password: &str) -> Result<User, AuthError>;
    async fn create_session(&self, user: &User) -> Result<Session, AuthError>;
    async fn validate_session(&self, session_id: &str) -> Result<Session, AuthError>;
    async fn revoke_session(&self, session_id: &str) -> Result<(), AuthError>;
}

/// Mock auth provider for testing
pub struct MockAuthProvider;

#[async_trait]
impl AuthProvider for MockAuthProvider {
    async fn authenticate(&self, username: &str, _password: &str) -> Result<User, AuthError> {
        Ok(User {
            id: "mock-user-id".to_string(),
            username: username.to_string(),
            email: Some(format!("{}@example.com", username)),
            roles: vec!["user".to_string()],
        })
    }

    async fn create_session(&self, user: &User) -> Result<Session, AuthError> {
        Ok(Session {
            id: "mock-session-id".to_string(),
            user_id: user.id.clone(),
            expires_at: chrono::Utc::now() + chrono::Duration::hours(24),
        })
    }

    async fn validate_session(&self, _session_id: &str) -> Result<Session, AuthError> {
        Err(AuthError::SessionExpired)
    }

    async fn revoke_session(&self, _session_id: &str) -> Result<(), AuthError> {
        Ok(())
    }
}

/// Configuration for authentication module
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub provider: AuthProviderType,
    pub session_timeout_minutes: u32,
    pub allow_guest: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuthProviderType {
    Mock,
    Local,
    OAuth,
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            provider: AuthProviderType::Mock,
            session_timeout_minutes: 60,
            allow_guest: true,
        }
    }
}

/// Main authentication module
pub struct AuthModule {
    provider: Box<dyn AuthProvider>,
    config: AuthConfig,
}

impl AuthModule {
    pub fn new(config: AuthConfig) -> Self {
        let provider: Box<dyn AuthProvider> = match config.provider {
            AuthProviderType::Mock => Box::new(MockAuthProvider),
            AuthProviderType::Local => Box::new(MockAuthProvider), // TODO: Implement LocalAuthProvider
            AuthProviderType::OAuth => Box::new(MockAuthProvider), // TODO: Implement OAuthProvider
        };
        
        Self { provider, config }
    }
    
    pub async fn login(&self, credentials: Credentials) -> Result<User, AuthError> {
        let user = self.provider.authenticate(&credentials.username, &credentials.password).await?;
        let _session = self.provider.create_session(&user).await?;
        Ok(user)
    }
    
    pub async fn get_session_token(&self) -> Result<String, AuthError> {
        // For now, return a mock token
        Ok("mock-session-token".to_string())
    }
    
    pub async fn logout(&self, session_id: &str) -> Result<(), AuthError> {
        self.provider.revoke_session(session_id).await
    }
    
    pub async fn validate_session(&self, session_id: &str) -> Result<Session, AuthError> {
        self.provider.validate_session(session_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mock_auth() {
        let provider = MockAuthProvider;
        let user = provider.authenticate("testuser", "password").await.unwrap();
        assert_eq!(user.username, "testuser");
    }
    
    #[tokio::test]
    async fn test_auth_module() {
        let module = AuthModule::new(AuthConfig::default());
        let credentials = Credentials {
            username: "testuser".to_string(),
            password: "password".to_string(),
        };
        let result = module.login(credentials).await;
        assert!(result.is_ok());
        let user = result.unwrap();
        assert_eq!(user.username, "testuser");
    }
}