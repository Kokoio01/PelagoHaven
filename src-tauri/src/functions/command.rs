use std::path::PathBuf;
use std::process::Command;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

pub fn get_command(command: &PathBuf) -> Result<Command, String> {
    let cmd = Command::new(command);
    #[cfg(target_os = "windows")] {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    return Ok(cmd);
}

pub fn get_script_command(app: &AppHandle, script: &str) -> Result<Command, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let runtime_dir = dir.join("runtime");

    let mut python_exe = runtime_dir.join("python").join("python.exe");
    #[cfg(not(target_os = "windows"))] {
        python_exe = runtime_dir.join("python").join("bin").join("python");
    }

    let core_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("core");
    let script_path = app
        .path()
        .resolve(script, BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    let mut cmd = get_command(&python_exe)?;
    cmd.arg(script_path)
        .current_dir(&core_dir)
        .env("PYTHONPATH", core_dir);

    Ok(cmd)
}
