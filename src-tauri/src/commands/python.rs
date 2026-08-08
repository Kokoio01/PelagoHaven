use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[derive(Deserialize, Serialize)]
pub struct ApiResponse {
    success: bool,
    game: Option<String>,
    options: Option<Value>,
    error: Option<String>,
}

#[tauri::command]
pub async fn get_game_options(app: AppHandle, game_name: String) -> Result<ApiResponse, String> {
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

    Ok(parsed)
}
