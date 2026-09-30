import { vi } from 'vitest';

/**
 * Reinicia los módulos (cache de vitest) e importa de nuevo todos los módulos
 * del backend para que connection.ts y los servicios usen la BD temporal
 * apuntada por process.env.DB_PATH (configurada en tests/helpers/db.ts).
 */
export async function freshBackend() {
  vi.resetModules();

  const connection = await import('../../src/db/connection.js');
  const migrate = await import('../../src/db/migrate.js');
  await connection.initDatabase();
  await migrate.runMigration();

  const query = await import('../../src/db/query.js');
  const { authService } = await import('../../src/services/auth.service.js');
  const { documentService } = await import('../../src/services/document.service.js');
  const { auditService } = await import('../../src/services/audit.service.js');

  return { connection, query, authService, documentService, auditService };
}

/** Crea una app Express para supertest (BD temp + migraciones aplicadas). */
export async function freshApp() {
  vi.resetModules();

  const connection = await import('../../src/db/connection.js');
  const migrate = await import('../../src/db/migrate.js');
  await connection.initDatabase();
  await migrate.runMigration();

  const { createApp } = await import('../../src/app.js');
  return createApp();
}

export function validPassword(salt: string): string {
  return `Password${salt}123!`;
}