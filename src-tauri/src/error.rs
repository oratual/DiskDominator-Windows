use thiserror::Error;

#[derive(Error, Debug)]
pub enum DiskDominatorError {
    #[error("Disk detection failed: {0}")]
    DiskDetection(String),

    #[error("Tauri runtime not initialized")]
    RuntimeNotReady,

    #[error("File system error: {0}")]
    FileSystem(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Duplicate scan failed: {0}")]
    DuplicateScan(String),

    #[error("Invalid disk letter: {0}")]
    InvalidDiskLetter(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Windows API error: {0}")]
    #[cfg(windows)]
    WindowsApi(String),

    #[error("Operation cancelled by user")]
    Cancelled,

    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

// Implementación para convertir a string para Tauri
impl From<DiskDominatorError> for String {
    fn from(err: DiskDominatorError) -> Self {
        err.to_string()
    }
}

// Result type alias para conveniencia
pub type DiskResult<T> = Result<T, DiskDominatorError>;

// Trait para añadir contexto a los errores
pub trait ErrorContext<T> {
    fn context(self, msg: &str) -> DiskResult<T>;
}

impl<T, E> ErrorContext<T> for Result<T, E>
where
    E: Into<DiskDominatorError>,
{
    fn context(self, msg: &str) -> DiskResult<T> {
        self.map_err(|e| {
            let base_error: DiskDominatorError = e.into();
            DiskDominatorError::Other(anyhow::anyhow!("{}: {}", msg, base_error))
        })
    }
}
