// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{LogicalPosition, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let mut win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("")
                .inner_size(1000.0, 600.0)
                .min_inner_size(1000.0, 600.0);

            #[cfg(target_os = "macos")]
            {
                win_builder = win_builder.title_bar_style(TitleBarStyle::Overlay);
                win_builder = win_builder.traffic_light_position(LogicalPosition { y: 22, x: 10 })
            }
            #[cfg(target_os = "windows")]
            {
                win_builder = win_builder.decorations(false);
            }
            #[cfg(target_os = "linux")]
            {
                win_builder = win_builder.decorations(false);
            }

            let _window = win_builder.build().unwrap();

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::world::get_worlds,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
