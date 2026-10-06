use std::os::windows::process::CommandExt;
use std::process::Command;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn get_script_command(app: &AppHandle, script: &str) -> Result<Command, String> {
    let python_exe = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("runtime")
        .join("python")
        .join("python.exe");
    let core_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("core");
    let script_path = app
        .path()
        .resolve(script, BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    let mut cmd = Command::new(python_exe);
    cmd.arg(script_path)
        .current_dir(&core_dir)
        .env("PYTHONPATH", core_dir);

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    Ok(cmd)
}
