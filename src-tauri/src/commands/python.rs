use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[derive(Deserialize, Serialize)]
struct ApiResponse {
    success: bool,
    game: Option<String>,
    groups: Option<HashMap<String, Vec<String>>>,
    options: Option<HashMap<String, Value>>,
    error: Option<String>,
}

#[tauri::command]
pub async fn get_game_options(app: AppHandle, game_name: String) -> Result<serde_json::Value, String> {
    println!("get_game_options");
    let output = app
        .shell()
        .sidecar("ap-helper")
        .map_err(|e| e.to_string())?
        .args(["get-options", &game_name])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    println!("{}", String::from_utf8_lossy(&output.stdout));

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: ApiResponse = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse Python output: {}", e))?;

    if !parsed.success {
        return Err(parsed.error.unwrap_or_else(|| "Unknown error".into()));
    }

    Ok(serde_json::to_value(parsed.options.unwrap_or_default()).map_err(|e| e.to_string())?)
}
