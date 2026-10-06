use std::process::Command;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

pub fn get_script_command(app: &&mut AppHandle, script: &str) -> Result<Command, String> {
    let python_exe = app.path().app_data_dir().map_err(|e| e.to_string())?.join("runtime").join("python").join("python.exe");
    let core_dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("core");
    let script_path = app.path().resolve(script, BaseDirectory::Resource).map_err(|e| e.to_string())?;

    let mut cmd = Command::new(python_exe);
    cmd.arg(script_path)
        .current_dir(&core_dir)
        .env("PYTHONPATH", core_dir);

    Ok(cmd)
}