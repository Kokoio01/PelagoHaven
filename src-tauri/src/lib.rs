extern crate alloc;

mod bootstrap;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            bootstrap::bootstrap_check_status,
            bootstrap::bootstrap_get_ap_versions,
            bootstrap::bootstrap_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
