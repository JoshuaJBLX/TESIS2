import { describe, it, expect, beforeEach } from 'vitest';
import '../helpers/db.js';
import { freshBackend } from '../helpers/bootstrap.js';

describe('AuditService', () => {
  let backend: Awaited<ReturnType<typeof freshBackend>>;

  beforeEach(async () => {
    backend = await freshBackend();
  });

  it('encadena los eventos con hashes SHA-256', async () => {
    const { auditService, query } = backend;
    const first = auditService.append('TEST_EVENT', 'entity', 'e1', 'u1', { action: 'crear' });
    const second = auditService.append('TEST_EVENT', 'entity', 'e1', 'u1', { action: 'actualizar' });

    expect(first.previous_hash).toBeNull();
    expect(first.current_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(second.previous_hash).toBe(first.current_hash);
    expect(second.id).toBe(first.id + 1);
  });

  it('verifica la cadena completa como válida', async () => {
    const { auditService } = backend;
    auditService.append('EVENT_A', 'doc', randomId(), 'u1', { n: 1 });
    auditService.append('EVENT_B', 'doc', randomId(), 'u2', { n: 2 });
    auditService.append('EVENT_C', 'user', randomId(), null, { n: 3 });

    const result = auditService.verifyChain();
    expect(result.valid).toBe(true);
    expect(result.entries).toBeGreaterThanOrEqual(3);
  });

  it('es de solo-append: no se pueden actualizar ni borrar registros', () => {
    const { auditService, query } = backend;
    const entry = auditService.append('EVENT_A', 'doc', randomId(), 'u1', { n: 1 });

    expect(() => query.run('UPDATE audit_log SET event_type = ? WHERE id = ?', ['HACKED', entry.id])).toThrow();
    expect(() => query.run('DELETE FROM audit_log WHERE id = ?', [entry.id])).toThrow();
  });

  it('detecta una manipulación si se rompe el encadenamiento', async () => {
    const { auditService, query } = backend;
    auditService.append('EVENT_A', 'doc', randomId(), 'u1', { n: 1 });
    auditService.append('EVENT_B', 'doc', randomId(), 'u2', { n: 2 });

    expect(auditService.verifyChain().valid).toBe(true);

    // La bitácora es append-only, así que la "manipulación" realista es insertar
    // un registro cuyo previous_hash no coincide con el último hash válido.
    query.run(
      "INSERT INTO audit_log (event_type, entity_type, entity_id, user_id, event_data, previous_hash, current_hash) VALUES ('EVENT_X', 'doc', 'x', null, '{}', 'roto', 'roto')"
    );

    const result = auditService.verifyChain();
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBeTruthy();
    expect(result.reason).toContain('previous_hash');
  });

  it('lista y filtra eventos', async () => {
    const { auditService } = backend;
    auditService.append('DOC_UPLOAD', 'document', randomId(), 'u1', { h: 'a' });
    auditService.append('DOC_UPLOAD', 'document', randomId(), 'u2', { h: 'b' });
    auditService.append('LOGIN', 'auth', 'u3', 'u3', { ok: true });

    const all = auditService.list(50, 0);
    expect(all.length).toBeGreaterThanOrEqual(3);

    const filtered = auditService.list(50, 0, { eventType: 'DOC_UPLOAD' });
    expect(filtered.every((e) => e.event_type === 'DOC_UPLOAD')).toBe(true);
    expect(auditService.count({ eventType: 'DOC_UPLOAD' })).toBe(2);
  });
});

function randomId(): string {
  return `id-${Math.random().toString(36).slice(2)}`;
}