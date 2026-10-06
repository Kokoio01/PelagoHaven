extern crate alloc;

use crate::functions::worlds::update_worlds;
use std::sync::Mutex;
use tauri::{Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};

mod commands;
mod functions;

pub struct AppState {
    pub conn: Mutex<rusqlite::Connection>,
}

#[derive(Default)]
pub struct OpenedFile(pub Mutex<Option<String>>);

#[tauri::command]
async fn get_opened_file(state: State<'_, OpenedFile>) -> Result<Option<String>, String> {
    Ok(state.0.lock().unwrap().take())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(main_window) = app.get_webview_window("main") {
                let _ = app.emit("file-open", &args);
                let _ = main_window.set_focus();
            }
        }))
        .manage(OpenedFile::default())
        .setup(|app| {
            let mut win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("PelagoHaven")
                .inner_size(1000.0, 600.0)
                .min_inner_size(1000.0, 600.0);

            #[cfg(target_os = "windows")]
            {
                win_builder = win_builder.decorations(false);
            }

            let _window = win_builder.build().unwrap();

            let data_dir = app.path().app_data_dir().unwrap();
            let mut conn = rusqlite::Connection::open(data_dir.join("app.db")).unwrap();
            conn.pragma_update(None, "journal_mode", "WAL").unwrap();
            functions::db::db_init(&mut conn).unwrap();

            app.manage(AppState {
                conn: Mutex::new(conn),
            });

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = update_worlds(app_handle).await;
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_opened_file,
            commands::bootstrap::bootstrap_check_status,
            commands::bootstrap::bootstrap_get_ap_versions,
            commands::bootstrap::bootstrap_install,
            commands::worlds::worlds_get_worlds,
            commands::worlds::worlds_analyze_world,
            commands::worlds::worlds_install_world,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
