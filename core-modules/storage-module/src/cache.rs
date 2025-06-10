use sqlx::sqlite::SqlitePool;
use serde::{Serialize, Deserialize};
use std::path::PathBuf;
use directories::ProjectDirs;
use crate::StorageError;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CachedFileInfo {
    pub path: String,
    pub name: String,
    pub size: i64,
    pub modified: i64,
    pub hash: Option<String>,
    pub extension: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedScanResult {
    pub scan_id: String,
    pub root_path: String,
    pub total_files: i64,
    pub total_size: i64,
    pub scan_date: i64,
    pub scan_type: String,
}

pub struct CacheManager {
    pool: SqlitePool,
    db_path: PathBuf,
}

impl CacheManager {
    pub async fn new(app_name: &str) -> Result<Self, StorageError> {
        let proj_dirs = ProjectDirs::from("com", "diskdominator", app_name)
            .ok_or_else(|| StorageError::InitError("Failed to get project directories".into()))?;
        
        let data_dir = proj_dirs.data_dir();
        std::fs::create_dir_all(data_dir)
            .map_err(|e| StorageError::IoError(e))?;
        
        let db_path = data_dir.join("cache.db");
        let db_url = format!("sqlite:{}", db_path.display());
        
        let pool = SqlitePool::connect(&db_url).await
            .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        let cache = Self { pool, db_path };
        cache.initialize_schema().await?;
        
        Ok(cache)
    }
    
    async fn initialize_schema(&self) -> Result<(), StorageError> {
        let schema = r#"
            CREATE TABLE IF NOT EXISTS scan_results (
                scan_id TEXT PRIMARY KEY,
                root_path TEXT NOT NULL,
                total_files INTEGER NOT NULL,
                total_size INTEGER NOT NULL,
                scan_date INTEGER NOT NULL,
                scan_type TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS cached_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scan_id TEXT NOT NULL,
                path TEXT NOT NULL,
                name TEXT NOT NULL,
                size INTEGER NOT NULL,
                modified INTEGER NOT NULL,
                hash TEXT,
                extension TEXT,
                FOREIGN KEY (scan_id) REFERENCES scan_results(scan_id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_files_scan_id ON cached_files(scan_id);
            CREATE INDEX IF NOT EXISTS idx_files_hash ON cached_files(hash);
            CREATE INDEX IF NOT EXISTS idx_files_size ON cached_files(size);
        "#;
        
        sqlx::raw_sql(schema)
            .execute(&self.pool)
            .await
            .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        Ok(())
    }
    
    pub async fn save_scan_result(
        &self,
        scan_id: &str,
        root_path: &str,
        files: &[CachedFileInfo],
        scan_type: &str,
    ) -> Result<(), StorageError> {
        let mut tx = self.pool.begin().await
            .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        // Insert scan result
        let total_files = files.len() as i64;
        let total_size: i64 = files.iter().map(|f| f.size).sum();
        let scan_date = chrono::Utc::now().timestamp();
        
        sqlx::query(
            r#"
            INSERT INTO scan_results (scan_id, root_path, total_files, total_size, scan_date, scan_type)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
        )
        .bind(scan_id)
        .bind(root_path)
        .bind(total_files)
        .bind(total_size)
        .bind(scan_date)
        .bind(scan_type)
        .execute(&mut *tx)
        .await
        .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        // Insert files
        for file in files {
            sqlx::query(
                r#"
                INSERT INTO cached_files (scan_id, path, name, size, modified, hash, extension)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                "#,
            )
            .bind(scan_id)
            .bind(&file.path)
            .bind(&file.name)
            .bind(file.size)
            .bind(file.modified)
            .bind(&file.hash)
            .bind(&file.extension)
            .execute(&mut *tx)
            .await
            .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        }
        
        tx.commit().await
            .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        Ok(())
    }
    
    pub async fn get_cached_files(&self, scan_id: &str) -> Result<Vec<CachedFileInfo>, StorageError> {
        let files = sqlx::query_as::<_, CachedFileInfo>(
            r#"
            SELECT path, name, size as "size: i64", modified as "modified: i64", hash, extension
            FROM cached_files
            WHERE scan_id = ?1
            "#,
        )
        .bind(scan_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        Ok(files)
    }
    
    pub async fn find_duplicates_by_hash(&self) -> Result<Vec<(String, Vec<CachedFileInfo>)>, StorageError> {
        #[derive(sqlx::FromRow)]
        struct DuplicateRow {
            hash: Option<String>,
            count: i64,
        }
        
        let duplicates = sqlx::query_as::<_, DuplicateRow>(
            r#"
            SELECT hash, COUNT(*) as count
            FROM cached_files
            WHERE hash IS NOT NULL
            GROUP BY hash
            HAVING count > 1
            "#
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        let mut result = Vec::new();
        
        for dup in duplicates {
            if let Some(hash) = dup.hash {
                let files = sqlx::query_as::<_, CachedFileInfo>(
                    r#"
                    SELECT path, name, size as "size: i64", modified as "modified: i64", hash, extension
                    FROM cached_files
                    WHERE hash = ?1
                    "#,
                )
                .bind(&hash)
                .fetch_all(&self.pool)
                .await
                .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
                
                result.push((hash, files));
            }
        }
        
        Ok(result)
    }
    
    pub async fn cleanup_old_scans(&self, days: i64) -> Result<u64, StorageError> {
        let cutoff_date = chrono::Utc::now().timestamp() - (days * 24 * 60 * 60);
        
        let result = sqlx::query(
            r#"
            DELETE FROM scan_results
            WHERE scan_date < ?1
            "#,
        )
        .bind(cutoff_date)
        .execute(&self.pool)
        .await
        .map_err(|e| StorageError::DatabaseError(e.to_string()))?;
        
        Ok(result.rows_affected())
    }
}