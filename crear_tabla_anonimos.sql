CREATE TABLE IF NOT EXISTS identidades_anonimas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'America/Bogota',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anonimos_token
ON identidades_anonimas(token_hash);
