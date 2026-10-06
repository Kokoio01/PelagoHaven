use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

pub fn db_init(conn: &mut Connection) -> Result<(), String> {
    let migrations = Migrations::new(vec![
        M::up("CREATE TABLE IF NOT EXISTS worlds (\
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            authors TEXT,
            options TEXT NOT NULL CHECK (json_valid(options))
        );")
    ]);

    migrations.to_latest(conn).map_err(|e| e.to_string())?;
    
    Ok(())
}