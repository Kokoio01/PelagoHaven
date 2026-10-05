extern crate alloc;

use tauri::{WebviewUrl, WebviewWindowBuilder};

mod bootstrap;

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

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            bootstrap::bootstrap_check_status,
            bootstrap::bootstrap_get_ap_versions,
            bootstrap::bootstrap_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
