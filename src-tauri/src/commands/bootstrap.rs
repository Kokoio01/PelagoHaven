use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::path::Path;
use std::process::{Command};
use futures_util::StreamExt;
use reqwest::header::USER_AGENT;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri::ipc::Channel;
use tokio::io::AsyncWriteExt;
use regex::Regex;

#[derive(Deserialize, Serialize)]
pub struct StatusResponse {
    status: bool,
    python: bool,
    core: bool,
}

#[derive(Deserialize, Serialize)]
pub struct APVersion {
    name: String,
    tag_name: String,
    prerelease: bool,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct InstallProgress {
    step: String,
    percentage: f64,
}

#[tauri::command]
pub fn bootstrap_check_status(app: AppHandle) -> Result<StatusResponse, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let python = path.join("runtime").join("python").join("python.exe").exists();
    let core = path.join("core").join("BaseClasses.py").exists();
    let status = python && core;

    Ok(StatusResponse { status, python, core })
}

#[tauri::command]
pub async fn bootstrap_get_ap_versions() -> Result<Vec<APVersion>, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.github.com/repos/ArchipelagoMW/Archipelago/releases")
        .header(USER_AGENT, "PelagoHaven/0.1")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let versions: Vec<APVersion> = response.json().await.map_err(|e| e.to_string())?;
    Ok(versions)
}

fn patch_path(dir: &Path, env_versions: &mut HashMap<String, String>) -> Result<String, String> {
    let re = Regex::new(r"git\+https://github\.com/([^/]+)/([^/@]+?)(?:\.git)?@([a-zA-Z0-9_.\-]+)")
        .map_err(|e| e.to_string())?;

    let re_version = Regex::new(r"^\s*([a-zA-Z0-9_\-]+)\s*@\s*[^#\n]+#([0-9a-zA-Z_.\-+]+)")
        .map_err(|e| e.to_string())?;
    let patch_dir = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in patch_dir.flatten() {
        let path = entry.path();
        if path.is_dir() {
            patch_path(&path, env_versions)?;
        } else if path.file_name().map_or(false, |name| name == "requirements.txt") {
            if let Ok(contents) = fs::read_to_string(entry.path()) {
                for line in contents.lines() {
                    if let Some(caps) = re_version.captures(line) {
                        let name = caps[1].to_uppercase().replace('-', "_");
                        let version = caps[2].to_string();
                        env_versions.insert(name, version);
                    }
                }

                if re.is_match(&contents) {
                    let replaced = re.replace_all(&contents, "https://github.com/$1/$2/archive/$3.tar.gz");
                    fs::write(entry.path(), replaced.as_bytes()).map_err(|e| e.to_string())?;
                }
            }
        }
    }
    Ok("done".into())
}
#[tauri::command]
pub async fn bootstrap_install(app: AppHandle, apversion: String, on_progress: Channel<InstallProgress>) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let runtime_dir = dir.join("runtime");
    let core_dir = dir.join("core");
    let worlds_dir = dir.join("worlds");

    let python_exe = runtime_dir.join("python").join("python.exe");

    println!("{:?}", runtime_dir);
    if python_exe.exists() {
        let _event = on_progress.send(InstallProgress {
            step: "python".into(),
            percentage: 100.0,
        });
    } else {
        let _event = on_progress.send(InstallProgress {
            step: "python".into(),
            percentage: 0.0,
        });

        tokio::fs::create_dir_all(&runtime_dir).await.map_err(|e| e.to_string())?;
        let temp_archive = runtime_dir.join("python_installer.tar.gz");

        let download_url = "https://github.com/astral-sh/python-build-standalone/releases/download/20261003/cpython-3.11.17+20261003-x86_64-pc-windows-msvc-install_only.tar.gz";
        let client = reqwest::Client::new();
        let response = client
            .get(download_url)
            .header(USER_AGENT, "PelagoHaven/0.1")
            .send()
            .await
            .map_err(|e| format!("Download request failed: {e}"))?;

        let total_size = response.content_length().unwrap_or(0);
        let mut downloaded: u64 = 0;
        let mut stream = response.bytes_stream();
        let mut output = tokio::fs::File::create(&temp_archive).await.map_err(|e| e.to_string())?;

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| e.to_string())?;
            output.write_all(&chunk).await.map_err(|e| e.to_string())?;

            downloaded += chunk.len() as u64;

            let percentage = if total_size > 0 {
                (downloaded as f64 / total_size as f64) * 100.0
            } else {
                0.0
            };

            let _event = on_progress.send(InstallProgress {
                step: "python".into(),
                percentage,
            });
        }

        drop(output);

        let _event = on_progress.send(InstallProgress {
            step: "extracting_python".into(),
            percentage: 0.0,
        });

        let source = temp_archive.clone();
        let target = runtime_dir.clone();

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            let tar_gz = File::open(&source).map_err(|e| e.to_string())?;
            let tar = flate2::read::GzDecoder::new(tar_gz);
            let mut archive = tar::Archive::new(tar);

            archive.unpack(&target).map_err(|e| e.to_string())?;

            let _ = fs::remove_file(&source);
            Ok(())
        })
            .await
            .map_err(|e| e.to_string())??;

        let _event = on_progress.send(InstallProgress {
            step: "extracting_python".into(),
            percentage: 100.0,
        });
    }

    let core_main = core_dir.join("main.py");

    if core_main.exists() {
        tokio::fs::remove_dir_all(&core_dir).await.map_err(|e| e.to_string())?;
    }

    let _event = on_progress.send(InstallProgress {
        step: "ap".into(),
        percentage: 0.0,
    });

    tokio::fs::create_dir_all(&core_dir).await.map_err(|e| e.to_string())?;
    let temp_archive = core_dir.join("archipelago.tar.gz");

    let download_url = "https://api.github.com/repos/ArchipelagoMW/Archipelago/tarball/".to_owned() + apversion.as_str();
    let client = reqwest::Client::new();
    let response = client
        .get(download_url)
        .header(USER_AGENT, "PelagoHaven/0.1")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    let mut output = tokio::fs::File::create(&temp_archive).await.map_err(|e| e.to_string())?;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        output.write_all(&chunk).await.map_err(|e| e.to_string())?;

        downloaded += chunk.len() as u64;

        let percentage = if total_size > 0 {
            (downloaded as f64 / total_size as f64) * 100.0
        } else {
            0.0
        };

        let _event = on_progress.send(InstallProgress {
            step: "ap".into(),
            percentage,
        });
    }

    drop(output);

    let _event = on_progress.send(InstallProgress {
        step: "extracting_ap".into(),
        percentage: 0.0,
    });

    let source = temp_archive.clone();
    let target = core_dir.clone();

    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let tar_gz = File::open(&source).map_err(|e| e.to_string())?;
        let tar = flate2::read::GzDecoder::new(tar_gz);
        let mut archive = tar::Archive::new(tar);

        for entry in archive.entries().map_err(|e| e.to_string())? {
            let mut entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path().map_err(|e| e.to_string())?;

            if let Some(first_dir) = path.iter().next() {
                if let Ok(stripped_path) = path.strip_prefix(first_dir) {
                    if !stripped_path.as_os_str().is_empty() {
                        let dest = target.join(stripped_path);
                        entry.unpack(dest).map_err(|e| e.to_string())?;
                    }
                }
            }
        }

        let _ = fs::remove_file(&source);
        Ok(())
    })
        .await
        .map_err(|e| e.to_string())??;

    let _event = on_progress.send(InstallProgress {
        step: "extracting_ap".into(),
        percentage: 100.0,
    });

    let _event = on_progress.send(InstallProgress {
        step: "installing_ap".into(),
        percentage: 0.0,
    });

    let _output = Command::new(&python_exe)
        .args([
            "-m",
            "pip",
            "install",
            "--upgrade",
            "setuptools<81",
            "wheel"
        ])
        .output()
        .map_err(|e| e.to_string())?;

    let _event = on_progress.send(InstallProgress {
        step: "installing_ap".into(),
        percentage: 33.0,
    });

    let mut env_versions:HashMap<String,String> = HashMap::new();
    patch_path(core_dir.as_path(), &mut env_versions).expect("done");

    let ap_updater = core_dir.join("ModuleUpdate.py");
    let mut cmd = Command::new(&python_exe);
    cmd.current_dir(&core_dir)
        .arg(&ap_updater)
        .arg("--yes")
        .env("SETUPTOOLS_SCM_PRETEND_VERSION", "0.1.0");

    for (pkg, version) in env_versions {
        let key = format!("SETUPTOOLS_SCM_PRETEND_VERSION_FOR_{}", pkg);
        cmd.env(key, version);
    }

    let _output = cmd.output().map_err(|e| e.to_string())?;

    let _event = on_progress.send(InstallProgress {
        step: "installing_ap".into(),
        percentage: 66.0,
    });

    let requirements_path = core_dir.join("requirements.txt");
    let _output = Command::new(&python_exe)
        .args([
            "-m",
            "pip",
            "install",
            "-r",
        ])
        .arg(&requirements_path)
        .output()
        .map_err(|e| e.to_string())?;

    let _event = on_progress.send(InstallProgress {
        step: "installing_ap".into(),
        percentage: 100.0,
    });

    let _event = on_progress.send(InstallProgress {
        step: "testing_ap".into(),
        percentage: 0.0,
    });

    let script_path = core_dir.join("Generate.py");
    let output = Command::new(&python_exe)
        .current_dir(&core_dir)
        .arg(&script_path)
        .arg("--help")
        .output()
        .map_err(|e| e.to_string())?;

    println!("stdout: {}", String::from_utf8_lossy(&output.stdout));
    let _event = on_progress.send(InstallProgress {
        step: "testing_ap".into(),
        percentage: 100.0,
    });

    let _event = on_progress.send(InstallProgress {
        step: "linking_ap".into(),
        percentage: 0.0,
    });

    let link_dir = core_dir.join("custom_worlds");

    if !worlds_dir.exists() {
        fs::create_dir_all(&worlds_dir).map_err(|e| e.to_string())?;
    }

    if junction::exists(&link_dir).unwrap_or(false) {
        junction::delete(&link_dir).map_err(|e| e.to_string())?;
    } else if link_dir.exists() {
        fs::remove_dir_all(&link_dir).map_err(|e| e.to_string())?;
    }

    junction::create(worlds_dir, link_dir).map_err(|e| e.to_string())?;

    let _event = on_progress.send(InstallProgress {
        step: "linking_ap".into(),
        percentage: 100.0,
    });

    let _event = on_progress.send(InstallProgress {
        step: "done".into(),
        percentage: 100.0,
    });

    Ok("done".into())
}