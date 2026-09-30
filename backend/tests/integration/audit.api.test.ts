import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import '../helpers/db.js';
import { freshApp, validPassword } from '../helpers/bootstrap.js';

let app: any;
let seed = 0;
function uname(): string {
  seed += 1;
  return `aud${seed}`;
}

async function createUser(): Promise<{ token: string; username: string }> {
  const username = uname();
  const password = validPassword('u');
  await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: 'U' }).expect(201);

  const login = await request(app).post('/api/auth/login').send({ username, password }).expect(200);
  return { token: login.body.data.accessToken, username };
}

async function makeAdmin(): Promise<{ token: string; username: string }> {
  const username = uname();
  const password = validPassword('u');
  await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: 'Administrador' }).expect(201);

  // Elevamos el rol en la BD con la MISMA conexión/instancia que maneja esta app
  const connection = await import('../../src/db/connection.js');
  connection.getDatabase().run('UPDATE users SET role = ? WHERE username = ?', ['admin', username]);

  const login = await request(app).post('/api/auth/login').send({ username, password }).expect(200);
  return { token: login.body.data.accessToken, username };
}

function tempTextFile(content: string): { file: Buffer; name: string } {
  const name = `a-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, content, 'utf8');
  return { file: fs.readFileSync(p), name };
}

beforeEach(async () => {
  app = await freshApp();
});

describe('API /api/audit', () => {
  it('exige rol de administrador', async () => {
    const { token } = await createUser();
    const res = await request(app).get('/api/audit').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);

    await request(app).get('/api/audit').expect(401);
  });

  it('listas eventos generados por el uso del sistema', async () => {
    const admin = await makeAdmin();

    // Generar actividad (registros, login, subida de documento)
    const username = uname();
    const password = validPassword('u');
    await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: 'U' }).expect(201);
    await request(app).post('/api/auth/login').send({ username, password }).expect(200);

    const login = await request(app).post('/api/auth/login').send({ username: admin.username, password: validPassword('u') }).expect(200);
    void login;

    const res = await request(app).get('/api/audit').set('Authorization', `Bearer ${admin.token}`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);

    const eventTypes = res.body.data.map((e: any) => e.event_type);
    expect(eventTypes).toContain('USER_REGISTERED');
    expect(eventTypes).toContain('LOGIN_SUCCESS');
  });

  it('filtra por tipo de evento', async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${admin.token}`)
      .query({ eventType: 'LOGIN_SUCCESS' })
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((e: any) => e.event_type === 'LOGIN_SUCCESS')).toBe(true);
  });

  it('verifica la integridad de la cadena de auditoría', async () => {
    const admin = await makeAdmin();
    const user = await createUser();

    // Actividad para llenar la bitácora
    const { file, name } = tempTextFile('documento auditado');
    await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${user.token}`)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .field('title', 'Auditable')
      .field('password', validPassword('u'))
      .expect(201);

    const res = await request(app).get('/api/audit/verify-chain').set('Authorization', `Bearer ${admin.token}`).expect(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.entries).toBeGreaterThan(0);
    expect(res.body.data.brokenAt).toBeNull();
  });
});