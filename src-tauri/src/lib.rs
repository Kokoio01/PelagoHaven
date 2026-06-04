// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder, LogicalPosition};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let mut win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("")
                .inner_size(800.0, 600.0);

            #[cfg(target_os = "macos")]
            {
                win_builder = win_builder.title_bar_style(TitleBarStyle::Overlay);
                win_builder = win_builder.traffic_light_position(LogicalPosition {y:22, x:10})
            }

            let _window = win_builder.build().unwrap();

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
