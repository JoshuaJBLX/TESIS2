import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, getDatabase, saveDatabase, closeDatabase } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function collectFiles(dir: string): Map<string, string> {
  const byName = new Map<string, string>();
  if (!fs.existsSync(dir)) return byName;

  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        byName.set(entry.name, fullPath);
      }
    }
  };

  walk(dir);
  return byName;
}

function repairTable(byName: Map<string, string>, table: string): void {
  const db = getDatabase();
  const rows = db.exec(
    `SELECT id, file_name, file_path FROM ${table}`
  );

  if (rows.length === 0) return;

  const columns = rows[0].columns;
  let fixed = 0;

  for (const row of rows[0].values as any[][]) {
    const record: Record<string, unknown> = {};
    columns.forEach((col, i) => (record[col] = row[i]));

    const id = String(record.id);
    const storedPath = String(record.file_path);

    if (storedPath && fs.existsSync(storedPath)) {
      continue;
    }

    const storedBasename = storedPath ? path.basename(storedPath) : String(record.file_name);
    const candidate = byName.get(storedBasename) || byName.get(String(record.file_name));
    if (!candidate) {
      console.warn(`  [skip] No se encontro el archivo "${storedBasename}" para ${table}:${id}`);
      continue;
    }

    db.run(`UPDATE ${table} SET file_path = ? WHERE id = ?`, [candidate, id]);
    fixed++;
    console.log(`  [fix] ${table}:${id} -> ${candidate}`);
  }

  console.log(`${table}: ${fixed} rutas actualizadas`);
}

export async function runRepair(): Promise<void> {
  await initDatabase();

  console.log('Reparando rutas de archivos en la base de datos...');
  const uploadsDir = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
  const byName = collectFiles(uploadsDir);
  console.log(`Archivos encontrados en ${uploadsDir}: ${byName.size}`);

  repairTable(byName, 'document_versions');
  repairTable(byName, 'document_proposals');

  saveDatabase();
  console.log('Reparacion completada.');
}

if (process.argv[1] && process.argv[1].endsWith('repair-paths.ts')) {
  try {
    await runRepair();
  } catch (error) {
    console.error('Repair failed:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}