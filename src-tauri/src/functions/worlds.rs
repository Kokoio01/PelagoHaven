use crate::functions::python::get_script_command;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Deserialize, Serialize)]
pub struct World {
    id: String,
    name: String,
    description: String,
    path: String,
    custom: bool,
    options: serde_json::Value,
}

pub async fn update_worlds(app: AppHandle) -> Result<(), String> {
    let mut command =
        get_script_command(&app, "scripts/worldData.py").map_err(|e| format!("{}", e))?;

    let output = command.output().map_err(|e| format!("{}", e))?;
    let stdout = String::from_utf8(output.stdout).map_err(|e| format!("{}", e))?;
    let _stderr = String::from_utf8(output.stderr).map_err(|e| format!("{}", e))?;
    if stdout.trim().is_empty() {
        return Ok(());
    }

    let worlds: Vec<World> = serde_json::from_str(&stdout).map_err(|e| format!("{}", e))?;

    let state = app.state::<AppState>();
    let mut conn = state.conn.lock().unwrap();
    let tx = conn.transaction().map_err(|e| format!("{}", e))?;

    tx.execute("DELETE FROM worlds", ())
        .map_err(|e| format!("{}", e))?;

    for world in worlds {
        tx.execute(
            "INSERT INTO worlds (id, name, description, path, custom, options) VALUES (?, ?, ?, ?, ?, ?)",
            (world.id, world.name, world.description, world.path, world.custom, serde_json::to_string(&world.options).unwrap()),
        ).map_err(|e| format!("{}", e))?;
    }

    tx.commit().map_err(|e| format!("{}", e))?;

    Ok(())
}
