import fs from 'fs';
import type { Database as SqlJsDatabase } from 'sql.js';
import type { DbDriver, SqlResultSet } from './driver.js';

/**
 * Adaptador de SQLite (sql.js) con persistencia explicita en disco.
 *
 * `sql.js` ejecuta SQLite en memoria; `save()` exporta el estado completo al
 * archivo `.sqlite`, por lo que toda escritura debe ir acompanada de un
 * `saveDatabase()` para ser durable.
 */
export function createSqliteDriver(db: SqlJsDatabase, dbPath: string): DbDriver {
  return {
    engine: 'sqlite',

    run(sql: string, params: unknown[] = []): void {
      db.run(sql, params as any[]);
    },

    exec(sql: string, params: unknown[] = []): SqlResultSet[] {
      return db.exec(sql, params as any[]) as SqlResultSet[];
    },

    save(): void {
      const buffer = Buffer.from(db.export());
      fs.writeFileSync(dbPath, buffer);
    },

    close(): void {
      db.close();
    }
  };
}
