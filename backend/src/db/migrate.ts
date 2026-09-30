import { initDatabase, getDatabase, saveDatabase, closeDatabase } from './connection.js';

function tableHasColumn(db: any, table: string, column: string): boolean {
  const result = db.exec(`PRAGMA table_info(${table})`);
  if (result.length === 0) return false;
  return result[0].values.some((row: any[]) => row[1] === column);
}

function addColumnIfMissing(db: any, table: string, column: string, definition: string): void {
  if (!tableHasColumn(db, table, column)) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

export async function runMigration(): Promise<void> {
  const db = await initDatabase();

  console.log('Running database migration...');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      encrypted_private_key TEXT NOT NULL,
      key_algorithm TEXT NOT NULL,
      key_fingerprint TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      coauthor_id TEXT,
      source_proposal_id TEXT,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      change_description TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id),
      FOREIGN KEY (coauthor_id) REFERENCES users(id),
      FOREIGN KEY (source_proposal_id) REFERENCES document_proposals(id),
      UNIQUE(document_id, version_number)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS document_proposals (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      base_version_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      proposed_by TEXT NOT NULL,
      signature_value TEXT NOT NULL,
      signature_algorithm TEXT NOT NULL,
      signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      change_description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      reviewed_by TEXT,
      reviewed_at DATETIME,
      accepted_version_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (base_version_id) REFERENCES document_versions(id),
      FOREIGN KEY (proposed_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id),
      FOREIGN KEY (accepted_version_id) REFERENCES document_versions(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS document_signatures (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL UNIQUE,
      signer_id TEXT NOT NULL,
      signature_value TEXT NOT NULL,
      signature_algorithm TEXT NOT NULL,
      signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (version_id) REFERENCES document_versions(id) ON DELETE CASCADE,
      FOREIGN KEY (signer_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT,
      event_data TEXT NOT NULL,
      previous_hash TEXT,
      current_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // La bitácora solo admite INSERT; las operaciones de modificación y borrado
  // fallan incluso si accidentalmente se invocan desde otra ruta.
  db.run(`CREATE TRIGGER IF NOT EXISTS audit_log_no_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END`);
  db.run(`CREATE TRIGGER IF NOT EXISTS audit_log_no_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END`);

  addColumnIfMissing(db, 'documents', 'is_public', 'is_public INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'document_versions', 'coauthor_id', 'coauthor_id TEXT');
  addColumnIfMissing(db, 'document_versions', 'source_proposal_id', 'source_proposal_id TEXT');

  db.run(`CREATE INDEX IF NOT EXISTS idx_versions_document ON document_versions(document_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_versions_coauthor ON document_versions(coauthor_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_documents_owner_public ON documents(owner_id, is_public)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_proposals_document ON document_proposals(document_id, status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_proposals_base_version ON document_proposals(base_version_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_proposals_creator ON document_proposals(proposed_by)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_log(current_hash)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

  saveDatabase();
  console.log('Migration completed successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  try {
    await runMigration();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}
