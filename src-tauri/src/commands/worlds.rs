use serde::Serialize;
use serde::{Deserialize, Deserializer};
use std::fs;
use std::fs::File;
use std::io::Read;
use std::path::Path;
use tauri::{AppHandle, Manager};
use zip::ZipArchive;
use crate::functions::worlds::update_worlds;

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
    pub path: String,
    pub official: bool,
}

#[derive(Serialize, Deserialize)]
pub struct AnalyzeResult {
    pub manifest: Option<ApWorldManifest>,
    pub errors: Option<Vec<String>>,
}
#[tauri::command]
pub fn worlds_analyze_world(path: String) -> Result<AnalyzeResult, String> {
    let mut errors: Vec<String> = Vec::new();
    let mut manifest: Option<ApWorldManifest> = None;

    if !path.ends_with(".apworld") {
        errors.push("File does not end with .apworld".to_string());
    }

    let file = match File::open(&path) {
        Ok(f) => f,
        Err(e) => {
            errors.push(format!("Failed to open file: {}", e));
            return Ok(AnalyzeResult {
                manifest,
                errors: Some(errors),
            });
        }
    };

    let mut archive = match ZipArchive::new(file) {
        Ok(a) => a,
        Err(e) => {
            errors.push(format!("Failed to read archive: {}", e));
            return Ok(AnalyzeResult {
                manifest,
                errors: Some(errors),
            });
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

        let file_name = file.name().map_err(|e| format!("{}", e))?.to_string();

        if file_name.ends_with("archipelago.json") {
            if let Err(e) = file.read_to_string(&mut json_content) {
                errors.push(format!("Failed to read manifest content: {}", e));
            } else {
                found_manifest = true;
            }
        }

        if file_name.ends_with("__init__.py") || file_name.ends_with("__init__.pyc") {
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
pub async fn worlds_install_world(mut app: AppHandle, path: String) -> Result<bool, String> {
    let src_path = Path::new(&path);
    let worlds_dir = app.path().app_data_dir().unwrap().join("worlds");

    let file_name = src_path
        .file_name()
        .ok_or_else(|| "Invalid source file path (no filename found).".to_string())?;

    let dest_file_path = worlds_dir.join(file_name);

    fs::copy(path, dest_file_path).map_err(|e| format!("Failed to copy: {}", e))?;
    update_worlds(&mut app).await?;
    Ok(true)
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