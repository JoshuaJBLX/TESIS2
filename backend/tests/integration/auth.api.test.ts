import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../helpers/db.js';
import { freshApp, validPassword } from '../helpers/bootstrap.js';

let app: any;
let seed = 0;
function uname(): string {
  seed += 1;
  return `aut${seed}`;
}

beforeEach(async () => {
  app = await freshApp();
});

describe('API /api/auth', () => {
  it('registra un usuario y devuelve sus claves', async () => {
    const username = uname();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, email: `${username}@test.pe`, password: validPassword('u'), fullName: 'Usuario Test' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBeTruthy();
    expect(res.body.data.username).toBe(username);
    expect(res.body.data.publicKeyFingerprint).toMatch(/^([0-9a-f]{2}:){31}[0-9a-f]{2}$/);
  });

  it('rechaza registro con contraseña débil', async () => {
    const username = uname();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, email: `${username}@test.pe`, password: 'corto', fullName: 'X' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('12 caracteres');
  });

  it('rechaza registro con campos faltantes', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: uname() }).expect(400);
    expect(res.body.error).toContain('Todos los campos son requeridos');
  });

  it('rechaza usuarios duplicados', async () => {
    const username = uname();
    const payload = { username, email: `${username}@test.pe`, password: validPassword('u'), fullName: 'Uno' };
    await request(app).post('/api/auth/register').send(payload).expect(201);
    const res = await request(app).post('/api/auth/register').send(payload).expect(400);
    expect(res.body.error).toContain('ya está registrado');
  });

  it('inicia sesión y devuelve access + refresh tokens', async () => {
    const username = uname();
    const password = validPassword('u');
    await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: 'X' }).expect(201);

    const res = await request(app).post('/api/auth/login').send({ username, password }).expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user.username).toBe(username);
  });

  it('rechaza credenciales inválidas', async () => {
    const username = uname();
    const password = validPassword('u');
    await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: 'X' }).expect(201);

    const res = await request(app).post('/api/auth/login').send({ username, password: 'MalPassword999!' }).expect(401);
    expect(res.body.success).toBe(false);
  });

  it('bloquea la cuenta tras 5 intentos fallidos consecutivos', async () => {
    const username = uname();
    const password = validPassword('u');
    await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: 'X' }).expect(201);

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/api/auth/login').send({ username, password: 'Incorrecta123!' });
      expect(res.status).toBe(401);
    }

    const blocked = await request(app).post('/api/auth/login').send({ username, password });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toContain('bloqueada');
  });

  it('refresca el access token', async () => {
    const username = uname();
    const password = validPassword('u');
    await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: 'X' }).expect(201);
    const login = await request(app).post('/api/auth/login').send({ username, password }).expect(200);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: login.body.data.refreshToken }).expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rechaza refresh tokens inexistentes', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'token-falso' }).expect(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /me requiere autenticación', async () => {
    await request(app).get('/api/auth/me').expect(401);

    const username = uname();
    const password = validPassword('u');
    await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: 'X' }).expect(201);
    const login = await request(app).post('/api/auth/login').send({ username, password }).expect(200);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.data.accessToken}`).expect(200);
    expect(res.body.data.username).toBe(username);
  });
});