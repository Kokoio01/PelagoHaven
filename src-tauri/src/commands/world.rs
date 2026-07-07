use std::ffi::OsStr;
use std::fs;
use std::fs::File;
use std::io::Read;
use std::path::Path;
use serde::{Deserialize, Deserializer};
use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_store::{StoreExt};
use zip::ZipArchive;

#[derive(Serialize, Deserialize, Debug)]
pub struct ApWorldManifest {
    pub game: Option<String>,
    pub version: Option<u32>,
    pub compatible_version: Option<u32>,
    pub minimum_ap_version: Option<String>,
    pub maximum_ap_version: Option<String>,
    pub world_version: Option<String>,
    #[serde(default, deserialize_with = "deserialize_authors")]
    pub authors: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ApWorld {
    #[serde(flatten)]
    pub manifest: ApWorldManifest,
    pub official: bool,
}

#[derive(Serialize, Deserialize)]
pub struct AnalyzeResult {
    pub manifest: Option<ApWorldManifest>,
    pub errors: Option<Vec<String>>,
}

#[tauri::command]
pub fn get_worlds(app_handle: AppHandle) -> Result<Vec<ApWorld>, String> {
    let store = app_handle
        .store("config.json")
        .map_err(|e| format!("Failed to access config store: {}", e))?;

    let archipelago_path_val = store
        .get("archipelago:windows:path")
        .ok_or("Archipelago path is not configured in settings.")?;

    let archipelago_path = archipelago_path_val
        .as_str()
        .ok_or("Configured path is not a valid string.")?;

    let worlds_dir = Path::new(archipelago_path).join("lib").join("worlds");
    let custom_worlds_dir = Path::new(archipelago_path).join("custom_worlds");

    let mut worlds: Vec<ApWorld> = Vec::new();
    let entries = fs::read_dir(worlds_dir).map_err(|e| format!("Failed to read directory: {}", e))?;
    let custom_entries = fs::read_dir(custom_worlds_dir).map_err(|e| format!("Failed to read directory: {}", e))?;
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(OsStr::to_str) == Some("apworld") {
                if let Ok(manifest) = read_manifest(&path) {
                    worlds.push(ApWorld {
                        manifest,
                        official: true,
                    });
                }
            }
        }
    }

    for entry in custom_entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(OsStr::to_str) == Some("apworld") {
                if let Ok(manifest) = read_manifest(&path) {
                    worlds.push(ApWorld {
                        manifest,
                        official: false,
                    });
                }
            }
        }
    }

    Ok(worlds)
}

#[tauri::command]
pub fn analyze_world(path: String) -> Result<AnalyzeResult, String> {
    let mut errors: Vec<String> = Vec::new();
    let mut manifest: Option<ApWorldManifest> = None;

    if !path.ends_with(".apworld") {
        errors.push("File does not end with .apworld".to_string());
    }

    let file = match File::open(&path) {
        Ok(f) => f,
        Err(e) => {
            errors.push(format!("Failed to open file: {}", e));
            return Ok(AnalyzeResult { manifest, errors: Some(errors) });
        }
    };

    let mut archive = match ZipArchive::new(file) {
        Ok(a) => a,
        Err(e) => {
            errors.push(format!("Failed to read archive: {}", e));
            return Ok(AnalyzeResult { manifest, errors: Some(errors) });
        }
    };

    let mut json_content = String::new();
    let mut found_manifest = false;
    let mut found_init = false;

    for i in 0..archive.len() {
        let mut file = match archive.by_index(i) {
            Ok(f) => f,
            Err(e) => {
                errors.push(format!("Failed to read file at index {}: {}", i, e));
                continue;
            }
        };

        if file.name().ends_with("archipelago.json") {
            if let Err(e) = file.read_to_string(&mut json_content) {
                errors.push(format!("Failed to read manifest content: {}", e));
            } else {
                found_manifest = true;
            }
        }

        if file.name().ends_with("__init__.py") || file.name().ends_with("__init__.pyc") {
            found_init = true;
        }

        if found_manifest && found_init {
            break;
        }
    }

    if !found_init {
        errors.push("Missing __init__.py module file".to_string());
    }

    if !found_manifest {
        errors.push("Missing archipelago.json manifest file".to_string());
    } else {
        match serde_json::from_str(&json_content) {
            Ok(parsed) => manifest = Some(parsed),
            Err(e) => errors.push(format!("Manifest parse error: {}", e)),
        }
    }

    let final_errors = if errors.is_empty() {
        None
    } else {
        Some(errors)
    };

    Ok(AnalyzeResult {
        manifest,
        errors: final_errors,
    })
}

#[tauri::command]
pub fn install_world(app_handle: AppHandle, path: String) -> Result<bool, String> {
    let src_path = Path::new(&path);

    let file_name = src_path
        .file_name()
        .ok_or_else(|| "Invalid source file path (no filename found).".to_string())?;

    let store = app_handle
        .store("config.json")
        .map_err(|e| format!("Failed to access config store: {}", e))?;

    let archipelago_path_val = store
        .get("archipelago:windows:path")
        .ok_or("Archipelago path is not configured in settings.")?;

    let archipelago_path = archipelago_path_val
        .as_str()
        .ok_or("Configured path is not a valid string.")?;

    let worlds_dir = Path::new(archipelago_path).join("custom_worlds");
    let dest_file_path = worlds_dir.join(file_name);

    fs::copy(path, dest_file_path).map_err(|e| format!("Failed to copy: {}", e))?;
    Ok(true)
}

pub fn read_manifest(path: &Path) -> Result<ApWorldManifest, Box<dyn std::error::Error>> {
   let file = File::open(path)?;
    let mut archive = ZipArchive::new(file)?;

    let mut json = String::new();
    let mut found = false;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        if file.name().ends_with("archipelago.json") {
            file.read_to_string(&mut json)?;
            found = true;
            break;
        }
    }

    if !found {
        println!("ERROR: No archipelago.json file found");
    }

    let manifest: ApWorldManifest = serde_json::from_str(&json)?;
    Ok(manifest)
}

fn deserialize_authors<'de, D>(deserializer: D) -> Result<Option<Vec<String>>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Option::<serde_json::Value>::deserialize(deserializer)?;

    Ok(match value {
        Some(serde_json::Value::String(author)) => Some(vec![author]),
        Some(serde_json::Value::Array(authors)) => Some(
            authors
                .into_iter()
                .filter_map(|a| a.as_str().map(String::from))
                .collect(),
        ),
        _ => None,
    })
}