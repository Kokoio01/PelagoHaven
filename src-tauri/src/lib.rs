// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{Emitter, LogicalPosition, Manager, State, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use std::sync::Mutex;

pub mod commands;

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
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(OpenedFile::default())
        .setup(|app| {
            let mut win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("")
                .inner_size(1000.0, 600.0)
                .min_inner_size(1000.0, 600.0)
                .drag_and_drop(true);

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

            let args: Vec<String> = std::env::args().collect();
            if args.len() > 1 && args[1].ends_with(".apworld") {
                let state = app.state::<OpenedFile>();
                *state.0.lock().unwrap() = Some(args[1].clone());
            }

            let _window = win_builder.build().unwrap();

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_opened_file,
            commands::world::get_worlds,
            commands::world::analyze_world,
            commands::world::install_world,
            commands::world::uninstall_world,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
