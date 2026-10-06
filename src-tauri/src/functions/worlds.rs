use std::ops::Deref;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use crate::AppState;
use crate::functions::python::get_script_command;

#[derive(Deserialize, Serialize)]
pub struct World {
    id: String,
    name: String,
    description: String,
    custom: bool,
}

pub async fn update_worlds(app: &mut AppHandle) -> Result<(), String> {
    let mut command = get_script_command(&app, "scripts/worldData.py").map_err(|e| format!("{}", e))?;

    let output = command.output().map_err(|e| format!("{}", e))?;
    let stdout = String::from_utf8(output.stdout).map_err(|e| format!("{}", e))?;
    let _stderr = String::from_utf8(output.stderr).map_err(|e| format!("{}", e))?;
    if stdout.trim().is_empty() {
        return Ok(())
    }

    let worlds: Vec<World> = serde_json::from_str(&stdout).map_err(|e| format!("{}", e))?;

    let state = app.state::<AppState>();
    let mutex_conn = state.conn.lock().unwrap();
    let conn = mutex_conn.deref();

    for world in worlds {
        conn.execute("INSERT INTO worlds (id, name, description, custom)
                      VALUES (?, ?, ?, ?)
                      ON CONFLICT (id) DO UPDATE
                      SET custom = excluded.custom,
                          name = excluded.name,
                          description = excluded.description",
                     (world.id, world.name, world.description, world.custom))
            .map_err(|e| format!("{}", e))?;
    }

    Ok(())
}