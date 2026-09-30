import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { extractComparableText, compareComparableArtifacts } from '../../src/services/document-analysis.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

let dir: string;
let basePath: string;
let modifiedPath: string;
let identicalPath: string;
let binPath: string;
let emptyPath: string;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tesis-analysis-'));
  basePath = path.join(dir, 'base.txt');
  modifiedPath = path.join(dir, 'modificado.txt');
  identicalPath = path.join(dir, 'identico.txt');
  binPath = path.join(dir, 'ejecutable.bin');
  emptyPath = path.join(dir, 'vacio.txt');

  fs.writeFileSync(basePath, 'linea uno\nlinea dos\nlinea tres\n', 'utf8');
  fs.writeFileSync(modifiedPath, 'linea uno\nlinea MODIFICADA\nlinea cuatro\n', 'utf8');
  fs.writeFileSync(identicalPath, 'linea uno\nlinea dos\nlinea tres\n', 'utf8');
  fs.writeFileSync(binPath, 'CJKU barrier of binary data\r\n\x00\x01\x02', 'latin1');
  fs.writeFileSync(emptyPath, '', 'utf8');
});

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function artifact(p: string, name: string, mime: string, hash: string, versionNumber = 1, sourceLabel?: string) {
  return {
    label: `v${versionNumber}`,
    fileName: name,
    filePath: p,
    mimeType: mime,
    size: fs.statSync(p).size,
    hash,
    sourceLabel,
    versionNumber
  };
}

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

describe('extractComparableText', () => {
  it('lee archivos de texto sin depender de Python', () => {
    const extracted = extractComparableText(basePath, 'text/plain', 'base.txt');
    expect(extracted.mode).toBe('text');
    expect(extracted.text).toContain('linea dos');
  });

  it('marca archivos binarios sin texto legible', () => {
    const extracted = extractComparableText(binPath, 'application/octet-stream', 'ejecutable.bin');
    expect(extracted.mode).toBe('binary');
    expect(extracted.text).toBe('');
  });

  it('falla de forma segura si el archivo no existe', () => {
    const extracted = extractComparableText(path.join(dir, 'no-existe.txt'), 'text/plain', 'no-existe.txt');
    expect(['binary', 'text']).toContain(extracted.mode);
  });
});

describe('compareComparableArtifacts', () => {
  it('reporta archivos idénticos sin adiciones ni eliminaciones', () => {
    const result = compareComparableArtifacts(
      artifact(basePath, 'base.txt', 'text/plain', HASH_A, 1),
      artifact(identicalPath, 'identico.txt', 'text/plain', HASH_A, 2)
    );
    expect(result.supported).toBe(true);
    expect(result.mode).toBe('text');
    expect(result.summary.additions).toBe(0);
    expect(result.summary.deletions).toBe(0);
    expect(result.summary.unchanged).toBeGreaterThan(0);
    expect(result.summary.textReady).toBe(true);
    expect(result.lineDiffs.every((d) => d.type === 'equal')).toBe(true);
    expect(result.note).toBeUndefined();
  });

  it('detecta adiciones, eliminaciones y cambios entre versiones', () => {
    const result = compareComparableArtifacts(
      artifact(basePath, 'base.txt', 'text/plain', HASH_A, 1),
      artifact(modifiedPath, 'modificado.txt', 'text/plain', HASH_B, 2)
    );
    expect(result.summary.textReady).toBe(true);
    expect(result.summary.deletions).toBeGreaterThan(0);
    expect(result.summary.additions).toBeGreaterThanOrEqual(0);
    expect(result.lineDiffs.some((d) => d.type === 'delete')).toBe(true);
    expect(result.base.versionNumber).toBe(1);
    expect(result.target.versionNumber).toBe(2);
  });

  it('no muestra diffs de línea cuando no hay texto extraíble', () => {
    const result = compareComparableArtifacts(
      artifact(basePath, 'base.txt', 'text/plain', HASH_A, 1),
      artifact(binPath, 'ejecutable.bin', 'application/octet-stream', HASH_B, 2)
    );
    expect(result.supported).toBe(false);
    expect(result.lineDiffs).toEqual([]);
    expect(result.summary.textReady).toBe(false);
    expect(result.note).toBeTruthy();
  });

  it('registra diferencias de metadatos (nombre, tamaño, hash, origen)', () => {
    const result = compareComparableArtifacts(
      artifact(basePath, 'base.txt', 'text/plain', HASH_A, 1, 'Firmante A'),
      artifact(modifiedPath, 'modificado.txt', 'text/plain', HASH_B, 2, 'Firmante B')
    );
    const fields = result.metadata.map((m) => m.field);
    expect(fields).toContain('file_name');
    expect(fields).toContain('file_size');
    expect(fields).toContain('content_hash');
    expect(fields).toContain('origin');
  });

  it('no registra metadatos cuando los archivos coinciden', () => {
    const result = compareComparableArtifacts(
      artifact(basePath, 'base.txt', 'text/plain', HASH_A, 1),
      artifact(identicalPath, 'base.txt', 'text/plain', HASH_A, 2)
    );
    expect(result.metadata).toEqual([]);
  });

  it('maneja comparaciones con archivos vacíos sin romperse', () => {
    const result = compareComparableArtifacts(
      artifact(emptyPath, 'vacio.txt', 'text/plain', HASH_A, 1),
      artifact(basePath, 'base.txt', 'text/plain', HASH_B, 2)
    );
    expect(result.supported).toBe(false);
    expect(result.lineDiffs).toEqual([]);
  });
});