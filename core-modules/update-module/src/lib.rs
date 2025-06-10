//! Update module for DiskDominator
//! 
//! Handles automatic updates and version management

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum UpdateError {
    #[error("Network error: {0}")]
    Network(String),
    #[error("Invalid version: {0}")]
    InvalidVersion(String),
    #[error("Update not available")]
    NoUpdateAvailable,
    #[error("Installation failed: {0}")]
    InstallationFailed(String),
    #[error("Verification failed: {0}")]
    VerificationFailed(String),
}

/// Semantic version information
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub pre_release: Option<String>,
}

impl Version {
    pub fn new(major: u32, minor: u32, patch: u32) -> Self {
        Self {
            major,
            minor,
            patch,
            pre_release: None,
        }
    }

    pub fn parse(version_str: &str) -> Result<Self, UpdateError> {
        let parts: Vec<&str> = version_str.trim_start_matches('v').split('.').collect();
        if parts.len() < 3 {
            return Err(UpdateError::InvalidVersion(version_str.to_string()));
        }

        Ok(Self {
            major: parts[0].parse().map_err(|_| UpdateError::InvalidVersion(version_str.to_string()))?,
            minor: parts[1].parse().map_err(|_| UpdateError::InvalidVersion(version_str.to_string()))?,
            patch: parts[2].parse().map_err(|_| UpdateError::InvalidVersion(version_str.to_string()))?,
            pre_release: None,
        })
    }

    pub fn is_newer_than(&self, other: &Version) -> bool {
        if self.major > other.major {
            return true;
        }
        if self.major < other.major {
            return false;
        }
        if self.minor > other.minor {
            return true;
        }
        if self.minor < other.minor {
            return false;
        }
        self.patch > other.patch
    }
}

impl std::fmt::Display for Version {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}.{}.{}", self.major, self.minor, self.patch)?;
        if let Some(pre) = &self.pre_release {
            write!(f, "-{}", pre)?;
        }
        Ok(())
    }
}

/// Update information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: Version,
    pub release_date: chrono::DateTime<chrono::Utc>,
    pub download_url: String,
    pub size: u64,
    pub sha256: String,
    pub release_notes: String,
    pub is_critical: bool,
}

/// Update check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateStatus {
    UpToDate,
    UpdateAvailable(UpdateInfo),
    CheckFailed(String),
}

#[async_trait]
pub trait UpdateProvider: Send + Sync {
    /// Check for available updates
    async fn check_for_updates(&self, current_version: &Version) -> Result<UpdateStatus, UpdateError>;
    
    /// Download an update
    async fn download_update(&self, update_info: &UpdateInfo) -> Result<Vec<u8>, UpdateError>;
    
    /// Verify update integrity
    async fn verify_update(&self, data: &[u8], expected_sha256: &str) -> Result<(), UpdateError>;
    
    /// Install the update
    async fn install_update(&self, data: Vec<u8>) -> Result<(), UpdateError>;
}

/// Mock update provider for testing
pub struct MockUpdateProvider;

#[async_trait]
impl UpdateProvider for MockUpdateProvider {
    async fn check_for_updates(&self, current_version: &Version) -> Result<UpdateStatus, UpdateError> {
        let latest = Version::new(1, 1, 0);
        if latest.is_newer_than(current_version) {
            Ok(UpdateStatus::UpdateAvailable(UpdateInfo {
                version: latest,
                release_date: chrono::Utc::now(),
                download_url: "https://example.com/update.tar.gz".to_string(),
                size: 10485760, // 10MB
                sha256: "abc123".to_string(),
                release_notes: "Bug fixes and improvements".to_string(),
                is_critical: false,
            }))
        } else {
            Ok(UpdateStatus::UpToDate)
        }
    }

    async fn download_update(&self, _update_info: &UpdateInfo) -> Result<Vec<u8>, UpdateError> {
        Ok(vec![0; 1024]) // Mock data
    }

    async fn verify_update(&self, _data: &[u8], _expected_sha256: &str) -> Result<(), UpdateError> {
        Ok(())
    }

    async fn install_update(&self, _data: Vec<u8>) -> Result<(), UpdateError> {
        Ok(())
    }
}

/// Update configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConfig {
    pub check_interval_hours: u32,
    pub auto_check: bool,
    pub auto_download: bool,
    pub auto_install: bool,
    pub update_channel: UpdateChannel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateChannel {
    Stable,
    Beta,
    Nightly,
}

impl Default for UpdateConfig {
    fn default() -> Self {
        Self {
            check_interval_hours: 24,
            auto_check: true,
            auto_download: false,
            auto_install: false,
            update_channel: UpdateChannel::Stable,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_parsing() {
        let v = Version::parse("1.2.3").unwrap();
        assert_eq!(v.major, 1);
        assert_eq!(v.minor, 2);
        assert_eq!(v.patch, 3);

        let v2 = Version::parse("v2.0.0").unwrap();
        assert_eq!(v2.major, 2);
    }

    #[test]
    fn test_version_comparison() {
        let v1 = Version::new(1, 0, 0);
        let v2 = Version::new(1, 1, 0);
        let v3 = Version::new(2, 0, 0);

        assert!(v2.is_newer_than(&v1));
        assert!(v3.is_newer_than(&v2));
        assert!(!v1.is_newer_than(&v2));
    }
}