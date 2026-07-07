use std::ffi::OsStr;
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
    let entries = std::fs::read_dir(worlds_dir).map_err(|e| format!("Failed to read directory: {}", e))?;
    let custom_entries = std::fs::read_dir(custom_worlds_dir).map_err(|e| format!("Failed to read directory: {}", e))?;
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
                    println!("{:?}", manifest);
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

    println!("{}", json);
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