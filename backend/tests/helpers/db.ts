import path from 'path';
import fs from 'fs';
import os from 'os';
import { afterEach, beforeEach } from 'vitest';

let tempDir: string | null = null;

export function currentDbPath(): string | null {
  return tempDir ? path.join(tempDir, 'test.sqlite') : null;
}

/**
 * Crea un directorio temporal para la BD y apunta DB_PATH a un archivo nuevo.
 * Debe llamarse en beforeEach (o al inicio de beforeAll) junto a vi.resetModules()
 * para que connection.ts recién importado use la BD limpia.
 */
export function setupTempDb(): void {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tesis-test-'));
  process.env.DB_PATH = path.join(tempDir, 'test.sqlite');
  process.env.UPLOAD_DIR = path.join(tempDir, 'uploads');
  process.env.NODE_ENV = 'test';

  // Carpeta de subida temporal aislada fuera del repo.
  fs.mkdirSync(path.join(tempDir, 'uploads', 'proposals'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'uploads', 'temp'), { recursive: true });
}

export function teardownTempDb(): void {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
  delete process.env.DB_PATH;
  delete process.env.UPLOAD_DIR;
}

export function makeTempFile(name: string, content: string): string {
  const dir = tempDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'tesis-fixtures-'));
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

/** Conjunto de rutas creadas en ./uploads para poder limpiarlas. */
const createdUploads: string[] = [];

export function trackUploadedFile(relativePath: string): void {
  createdUploads.push(path.resolve(relativePath));
}

export function cleanupCreatedUploads(): void {
  while (createdUploads.length) {
    const p = createdUploads.pop();
    if (p) fs.rmSync(p, { force: true });
  }
}

beforeEach(() => {
  setupTempDb();
});

afterEach(() => {
  cleanupCreatedUploads();
  teardownTempDb();
  delete process.env.JWT_SECRET;
  delete process.env.JWT_REFRESH_SECRET;
});