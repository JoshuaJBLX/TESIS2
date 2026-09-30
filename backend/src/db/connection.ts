import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { DbDriver } from './driver.js';
import { createSqliteDriver } from './sqlite-driver.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let driver: DbDriver | null = null;

/**
 * Selecciona el motor de persistencia segun el entorno.
 *
 * - `DATABASE_URL` ausente  -> SQLite via sql.js (desarrollo local y pruebas)
 * - `DATABASE_URL` presente -> PostgreSQL / Supabase. La capa de datos ya
 *   esta preparada mediante el contrato `DbDriver`; falta convertir las
 *   consultas sincronas en asincronas. Ver
 *   `doc/04_implementacion_despliegue/plan_nube_vercel_supabase.md`.
 */
export async function initDatabase(): Promise<DbDriver> {
  if (driver) return driver;

  if (process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL esta definido pero el adaptador PostgreSQL todavia no esta habilitado. ' +
      'La capa de datos del proyecto es sincrona (sql.js) y requiere el paso documentado en ' +
      'doc/04_implementacion_despliegue/plan_nube_vercel_supabase.md. ' +
      'Para continuar en local, elimine DATABASE_URL y use DB_PATH.'
    );
  }

  const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || './data/database.sqlite');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
  const db: SqlJsDatabase = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  driver = createSqliteDriver(db, dbPath);
  return driver;
}

export function getDatabase(): DbDriver {
  if (!driver) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return driver;
}

export function saveDatabase(): void {
  if (driver) {
    driver.save();
  }
}

export function closeDatabase(): void {
  if (driver) {
    driver.save();
    driver.close();
    driver = null;
  }
}
