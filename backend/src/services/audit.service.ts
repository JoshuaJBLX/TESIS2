import crypto from 'crypto';
import { queryAll, queryOne, run } from '../db/query.js';
import { saveDatabase } from '../db/connection.js';

export interface AuditEntry {
  id: number;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  event_data: string;
  previous_hash: string | null;
  current_hash: string;
  created_at: string;
}

function canonical(entry: Pick<AuditEntry, 'event_type' | 'entity_type' | 'entity_id' | 'user_id' | 'event_data' | 'previous_hash' | 'created_at'>): string {
  return JSON.stringify({
    eventType: entry.event_type,
    entityType: entry.entity_type,
    entityId: entry.entity_id,
    userId: entry.user_id,
    eventData: typeof entry.event_data === 'string' ? JSON.parse(entry.event_data) : entry.event_data,
    previousHash: entry.previous_hash,
    timestamp: entry.created_at
  });
}

export class AuditService {
  append(eventType: string, entityType: string, entityId: string, userId: string | null, eventData: Record<string, unknown>): AuditEntry {
    const previous = queryOne('SELECT current_hash FROM audit_log ORDER BY id DESC LIMIT 1') as { current_hash: string } | null;
    const createdAt = new Date().toISOString();
    const previousHash = previous?.current_hash || null;
    const payload = { event_type: eventType, entity_type: entityType, entity_id: entityId, user_id: userId, event_data: JSON.stringify(eventData), previous_hash: previousHash, created_at: createdAt };
    const currentHash = crypto.createHash('sha256').update(canonical(payload)).digest('hex');
    run('INSERT INTO audit_log (event_type, entity_type, entity_id, user_id, event_data, previous_hash, current_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [eventType, entityType, entityId, userId, payload.event_data, previousHash, currentHash, createdAt]);
    saveDatabase();
    return queryOne('SELECT * FROM audit_log WHERE current_hash = ?', [currentHash]) as AuditEntry;
  }

  list(limit = 100, offset = 0, filters: { eventType?: string; entityType?: string; from?: string; to?: string } = {}): AuditEntry[] {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.eventType) { where.push('event_type = ?'); params.push(filters.eventType); }
    if (filters.entityType) { where.push('entity_type = ?'); params.push(filters.entityType); }
    if (filters.from) { where.push('created_at >= ?'); params.push(filters.from); }
    if (filters.to) { where.push('created_at <= ?'); params.push(filters.to); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return queryAll(`SELECT * FROM audit_log ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]) as AuditEntry[];
  }

  count(filters: { eventType?: string; entityType?: string; from?: string; to?: string } = {}): number {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.eventType) { where.push('event_type = ?'); params.push(filters.eventType); }
    if (filters.entityType) { where.push('entity_type = ?'); params.push(filters.entityType); }
    if (filters.from) { where.push('created_at >= ?'); params.push(filters.from); }
    if (filters.to) { where.push('created_at <= ?'); params.push(filters.to); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return Number((queryOne(`SELECT COUNT(*) as total FROM audit_log ${clause}`, params) as { total: number }).total || 0);
  }

  verifyChain(): { valid: boolean; entries: number; brokenAt: number | null; reason?: string } {
    const entries = queryAll('SELECT * FROM audit_log ORDER BY id ASC') as AuditEntry[];
    let previousHash: string | null = null;
    for (const entry of entries) {
      if (entry.previous_hash !== previousHash) return { valid: false, entries: entries.length, brokenAt: entry.id, reason: 'previous_hash no coincide' };
      let expected: string;
      try { expected = crypto.createHash('sha256').update(canonical(entry)).digest('hex'); }
      catch { return { valid: false, entries: entries.length, brokenAt: entry.id, reason: 'event_data inválido' }; }
      if (entry.current_hash !== expected) return { valid: false, entries: entries.length, brokenAt: entry.id, reason: 'current_hash no coincide' };
      previousHash = entry.current_hash;
    }
    return { valid: true, entries: entries.length, brokenAt: null };
  }
}

export const auditService = new AuditService();
