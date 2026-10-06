extern crate alloc;

use std::sync::Mutex;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

mod commands;
mod functions;

pub struct AppState {
    pub conn: Mutex<rusqlite::Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            let conn = rusqlite::Connection::open(data_dir.join("app.db")).unwrap();

            app.manage(AppState {
                conn: Mutex::new(conn)
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::bootstrap::bootstrap_check_status,
            commands::bootstrap::bootstrap_get_ap_versions,
            commands::bootstrap::bootstrap_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
