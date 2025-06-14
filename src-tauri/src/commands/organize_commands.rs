use crate::app_state::AppState;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::SystemTime;
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationRule {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub priority: i32,
    pub condition: RuleCondition,
    pub action: RuleAction,
    pub scope: RuleScope,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleCondition {
    pub condition_type: String, // "extension", "name_pattern", "date_range", "size_range", "mime_type", "folder_depth"
    pub operator: String, // "equals", "contains", "matches", "greater_than", "less_than", "between"
    pub value: serde_json::Value,
    pub case_sensitive: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleAction {
    pub action_type: String, // "move", "copy", "rename", "tag", "archive"
    pub destination: Option<String>,
    pub pattern: Option<String>,
    pub archive_format: Option<String>, // "zip", "7z", "tar.gz"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleScope {
    pub paths: Vec<String>,
    pub recursive: bool,
    pub include_hidden: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationPlan {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub status: String, // "draft", "ready", "executing", "completed", "failed"
    pub operations: Vec<PlanOperation>,
    pub metadata: PlanMetadata,
    pub ai_generated: bool,
    pub ai_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanMetadata {
    pub total_files: u64,
    pub total_size: u64,
    pub estimated_duration: u64, // seconds
    pub affected_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanOperation {
    pub id: String,
    pub plan_id: String,
    pub sequence: u32,
    pub operation_type: String, // "move", "copy", "rename", "delete", "mkdir", "archive"
    pub status: String,         // "pending", "in_progress", "completed", "failed", "skipped"
    pub source: OperationSource,
    pub destination: OperationDestination,
    pub options: OperationOptions,
    pub result: Option<OperationResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationSource {
    pub paths: Vec<String>,
    pub pattern: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationDestination {
    pub path: String,
    pub create_if_not_exists: bool,
    pub rename_pattern: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationOptions {
    pub overwrite_existing: Option<bool>,
    pub preserve_attributes: Option<bool>,
    pub follow_symlinks: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationResult {
    pub processed_files: u32,
    pub failed_files: u32,
    pub duration: u64,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryStructure {
    pub path: String,
    pub name: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: String,
    pub file_count: u64,
    pub subdirectory_count: u64,
    pub children: Vec<DirectoryStructure>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationSuggestion {
    pub id: String,
    pub suggestion_type: String, // "move", "rename", "group", "delete", "archive"
    pub title: String,
    pub description: String,
    pub from_paths: Vec<String>,
    pub to_path: String,
    pub affected_files: Vec<FileInfo>,
    pub estimated_time: u64,
    pub confidence: f32,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub modified: String,
    pub file_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationAnalysis {
    pub suggestions: Vec<OrganizationSuggestion>,
    pub insights: OrganizationInsights,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationInsights {
    pub disorganized_folders: Vec<String>,
    pub naming_inconsistencies: Vec<String>,
    pub duplicate_structures: Vec<String>,
    pub unused_directories: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationPreview {
    pub before: DirectoryStructure,
    pub after: DirectoryStructure,
    pub changes: Vec<Change>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Change {
    pub change_type: String, // "create", "move", "rename", "delete"
    pub source: Option<String>,
    pub destination: Option<String>,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationExecution {
    pub id: String,
    pub plan_id: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub status: String, // "running", "completed", "failed", "cancelled"
    pub progress: ExecutionProgress,
    pub rollback_available: bool,
    pub rollback_data: Option<RollbackData>,
    pub summary: Option<ExecutionSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionProgress {
    pub current_operation: u32,
    pub total_operations: u32,
    pub current_file: Option<String>,
    pub percentage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackData {
    pub operations: Vec<RollbackOperation>,
    pub expires_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackOperation {
    pub operation_type: String,
    pub original_path: String,
    pub moved_to_path: Option<String>,
    pub backup_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionSummary {
    pub files_moved: u32,
    pub files_renamed: u32,
    pub files_deleted: u32,
    pub space_saved: u64,
    pub errors: Vec<String>,
}

#[tauri::command]
pub async fn analyze_directory_structure(
    path: String,
    _state: State<'_, AppState>,
) -> Result<DirectoryStructure, String> {
    let path = Path::new(&path);

    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }

    analyze_directory_recursive(path, 0, 3) // Max depth of 3 for performance
        .map_err(|e| format!("Failed to analyze directory: {}", e))
}

fn analyze_directory_recursive(
    path: &Path,
    current_depth: u32,
    max_depth: u32,
) -> Result<DirectoryStructure, Box<dyn std::error::Error>> {
    let metadata = fs::metadata(path)?;
    let name = path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let modified = metadata
        .modified()
        .unwrap_or(SystemTime::UNIX_EPOCH)
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let mut children = Vec::new();
    let mut file_count = 0u64;
    let mut subdirectory_count = 0u64;
    let mut total_size = metadata.len();

    if metadata.is_dir() && current_depth < max_depth {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                if let Ok(child_metadata) = entry.metadata() {
                    if child_metadata.is_file() {
                        file_count += 1;
                        total_size += child_metadata.len();
                    } else if child_metadata.is_dir() {
                        subdirectory_count += 1;
                        if let Ok(child_structure) =
                            analyze_directory_recursive(&entry_path, current_depth + 1, max_depth)
                        {
                            total_size += child_structure.size;
                            file_count += child_structure.file_count;
                            subdirectory_count += child_structure.subdirectory_count;
                            children.push(child_structure);
                        }
                    }
                }
            }
        }
    }

    Ok(DirectoryStructure {
        path: path.to_string_lossy().to_string(),
        name,
        is_directory: metadata.is_dir(),
        size: total_size,
        modified: modified.to_string(),
        file_count,
        subdirectory_count,
        children,
    })
}

#[tauri::command]
pub async fn create_organization_plan(
    name: String,
    description: String,
    rules: Vec<OrganizationRule>,
    ai_enabled: bool,
    ai_prompt: Option<String>,
    paths: Vec<String>,
    _state: State<'_, AppState>,
) -> Result<OrganizationPlan, String> {
    let plan_id = Uuid::new_v4().to_string();

    // Analyze the provided paths and generate operations based on rules
    let mut operations = Vec::new();
    let mut affected_paths = Vec::new();
    let mut total_files = 0u64;
    let mut total_size = 0u64;

    for (i, path) in paths.iter().enumerate() {
        let path = Path::new(path);
        if let Ok(structure) = analyze_directory_recursive(path, 0, 3) {
            total_files += structure.file_count;
            total_size += structure.size;
            affected_paths.push(path.to_string_lossy().to_string());

            // Generate operations based on rules
            for rule in &rules {
                if rule.enabled {
                    if let Some(operation) =
                        generate_operation_from_rule(&plan_id, i as u32, &structure, rule)
                    {
                        operations.push(operation);
                    }
                }
            }
        }
    }

    // If no operations generated from rules, create some basic suggestions
    if operations.is_empty() && !paths.is_empty() {
        operations.push(PlanOperation {
            id: Uuid::new_v4().to_string(),
            plan_id: plan_id.clone(),
            sequence: 0,
            operation_type: "analyze".to_string(),
            status: "pending".to_string(),
            source: OperationSource {
                paths: paths.clone(),
                pattern: None,
            },
            destination: OperationDestination {
                path: paths[0].clone(),
                create_if_not_exists: false,
                rename_pattern: None,
            },
            options: OperationOptions {
                overwrite_existing: Some(false),
                preserve_attributes: Some(true),
                follow_symlinks: Some(false),
            },
            result: None,
        });
    }

    let estimated_duration = calculate_estimated_duration(&operations, total_files);

    Ok(OrganizationPlan {
        id: plan_id,
        name,
        description,
        created_at: chrono::Utc::now().to_rfc3339(),
        status: "ready".to_string(),
        operations,
        metadata: PlanMetadata {
            total_files,
            total_size,
            estimated_duration,
            affected_paths,
        },
        ai_generated: ai_enabled,
        ai_prompt,
    })
}

fn generate_operation_from_rule(
    plan_id: &str,
    sequence: u32,
    structure: &DirectoryStructure,
    rule: &OrganizationRule,
) -> Option<PlanOperation> {
    // Simple rule evaluation - in a real implementation this would be more sophisticated
    let matches = match rule.condition.condition_type.as_str() {
        "extension" => {
            if let Some(ext) = Path::new(&structure.path).extension() {
                ext.to_string_lossy().to_lowercase()
                    == rule.condition.value.as_str().unwrap_or("").to_lowercase()
            } else {
                false
            }
        }
        "name_pattern" => {
            let pattern = rule.condition.value.as_str().unwrap_or("");
            structure.name.contains(pattern)
        }
        "size_range" => {
            if let Some(threshold) = rule.condition.value.as_u64() {
                match rule.condition.operator.as_str() {
                    "greater_than" => structure.size > threshold,
                    "less_than" => structure.size < threshold,
                    _ => false,
                }
            } else {
                false
            }
        }
        _ => false,
    };

    if !matches {
        return None;
    }

    let destination_path = rule
        .action
        .destination
        .clone()
        .unwrap_or_else(|| format!("{}/organized", structure.path));

    Some(PlanOperation {
        id: Uuid::new_v4().to_string(),
        plan_id: plan_id.to_string(),
        sequence,
        operation_type: rule.action.action_type.clone(),
        status: "pending".to_string(),
        source: OperationSource {
            paths: vec![structure.path.clone()],
            pattern: rule.action.pattern.clone(),
        },
        destination: OperationDestination {
            path: destination_path,
            create_if_not_exists: true,
            rename_pattern: rule.action.pattern.clone(),
        },
        options: OperationOptions {
            overwrite_existing: Some(false),
            preserve_attributes: Some(true),
            follow_symlinks: Some(false),
        },
        result: None,
    })
}

fn calculate_estimated_duration(operations: &[PlanOperation], total_files: u64) -> u64 {
    // Simple estimation: 1 second per 100 files + 10 seconds per operation
    let base_time = operations.len() as u64 * 10;
    let file_time = total_files / 100;
    base_time + file_time
}

#[tauri::command]
pub async fn execute_organization_plan(
    plan_id: String,
    dry_run: Option<bool>,
    create_backup: Option<bool>,
    _state: State<'_, AppState>,
) -> Result<OrganizationExecution, String> {
    let execution_id = Uuid::new_v4().to_string();
    let is_dry_run = dry_run.unwrap_or(false);
    let should_backup = create_backup.unwrap_or(true);

    // In a real implementation, we would:
    // 1. Load the plan from storage
    // 2. Execute operations sequentially
    // 3. Update progress in real-time
    // 4. Create rollback data if not dry run
    // 5. Handle errors and rollback if needed

    // For now, return a mock execution
    Ok(OrganizationExecution {
        id: execution_id,
        plan_id,
        started_at: chrono::Utc::now().to_rfc3339(),
        completed_at: if is_dry_run {
            Some(chrono::Utc::now().to_rfc3339())
        } else {
            None
        },
        status: if is_dry_run {
            "completed".to_string()
        } else {
            "running".to_string()
        },
        progress: ExecutionProgress {
            current_operation: 0,
            total_operations: 1,
            current_file: None,
            percentage: if is_dry_run { 100.0 } else { 0.0 },
        },
        rollback_available: should_backup && !is_dry_run,
        rollback_data: if should_backup && !is_dry_run {
            Some(RollbackData {
                operations: vec![],
                expires_at: chrono::Utc::now()
                    .checked_add_signed(chrono::Duration::days(7))
                    .unwrap_or_else(chrono::Utc::now)
                    .to_rfc3339(),
            })
        } else {
            None
        },
        summary: if is_dry_run {
            Some(ExecutionSummary {
                files_moved: 0,
                files_renamed: 0,
                files_deleted: 0,
                space_saved: 0,
                errors: vec![],
            })
        } else {
            None
        },
    })
}

#[tauri::command]
pub async fn preview_organization_changes(
    plan_id: String,
    _state: State<'_, AppState>,
) -> Result<OrganizationPreview, String> {
    // In a real implementation, we would:
    // 1. Load the plan from storage
    // 2. Simulate the operations
    // 3. Generate before/after directory structures
    // 4. Create detailed change list

    // For now, return a mock preview
    let mock_before = DirectoryStructure {
        path: "/example/source".to_string(),
        name: "source".to_string(),
        is_directory: true,
        size: 1024000,
        modified: "1640995200".to_string(),
        file_count: 10,
        subdirectory_count: 2,
        children: vec![],
    };

    let mock_after = DirectoryStructure {
        path: "/example/organized".to_string(),
        name: "organized".to_string(),
        is_directory: true,
        size: 1024000,
        modified: chrono::Utc::now().timestamp().to_string(),
        file_count: 10,
        subdirectory_count: 3,
        children: vec![],
    };

    let changes = vec![
        Change {
            change_type: "create".to_string(),
            source: None,
            destination: Some("/example/organized".to_string()),
            description: "Create organized directory".to_string(),
        },
        Change {
            change_type: "move".to_string(),
            source: Some("/example/source/file1.txt".to_string()),
            destination: Some("/example/organized/documents/file1.txt".to_string()),
            description: "Move file1.txt to documents folder".to_string(),
        },
    ];

    Ok(OrganizationPreview {
        before: mock_before,
        after: mock_after,
        changes,
    })
}

#[tauri::command]
pub async fn rollback_organization(
    plan_id: String,
    _state: State<'_, AppState>,
) -> Result<bool, String> {
    // In a real implementation, we would:
    // 1. Load rollback data for the plan
    // 2. Execute reverse operations
    // 3. Restore original file locations
    // 4. Update plan status

    // For now, return success
    Ok(true)
}

#[tauri::command]
pub async fn get_organization_suggestions(
    paths: Vec<String>,
    _state: State<'_, AppState>,
) -> Result<OrganizationAnalysis, String> {
    // Generate smart suggestions based on directory analysis
    let mut suggestions = Vec::new();
    let mut disorganized_folders = Vec::new();
    let naming_inconsistencies = Vec::new();

    for path in &paths {
        let path_obj = Path::new(path);
        if let Ok(structure) = analyze_directory_recursive(path_obj, 0, 3) {
            // Analyze for common organization opportunities
            if structure.file_count > 50 {
                suggestions.push(OrganizationSuggestion {
                    id: Uuid::new_v4().to_string(),
                    suggestion_type: "group".to_string(),
                    title: format!("Organize files in {}", structure.name),
                    description: format!(
                        "Group {} files by type in organized folders",
                        structure.file_count
                    ),
                    from_paths: vec![structure.path.clone()],
                    to_path: format!("{}/organized", structure.path),
                    affected_files: vec![], // Would be populated with actual files
                    estimated_time: 30,
                    confidence: 0.8,
                    reason: "Large number of files detected in single directory".to_string(),
                });
                disorganized_folders.push(structure.path.clone());
            }

            if structure.name.contains("temp") || structure.name.contains("tmp") {
                suggestions.push(OrganizationSuggestion {
                    id: Uuid::new_v4().to_string(),
                    suggestion_type: "archive".to_string(),
                    title: format!("Archive temporary files in {}", structure.name),
                    description: "Move old temporary files to archive".to_string(),
                    from_paths: vec![structure.path.clone()],
                    to_path: format!("{}_archive", structure.path),
                    affected_files: vec![],
                    estimated_time: 15,
                    confidence: 0.9,
                    reason: "Temporary directory detected".to_string(),
                });
            }
        }
    }

    Ok(OrganizationAnalysis {
        suggestions,
        insights: OrganizationInsights {
            disorganized_folders,
            naming_inconsistencies,
            duplicate_structures: vec![],
            unused_directories: vec![],
        },
    })
}
