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
  return `ver${seed}`;
}

function tempTextFile(content: string): { file: Buffer; name: string } {
  const name = `v-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, content, 'utf8');
  return { file: fs.readFileSync(p), name };
}

async function uploadDoc(content: string, title = 'Verificable'): Promise<{ docId: string; token: string; username: string; file: Buffer; name: string }> {
  const username = uname();
  const password = validPassword('w');
  await request(app).post('/api/auth/register').send({ username, email: `${username}@test.pe`, password, fullName: `U ${username}` }).expect(201);
  const login = await request(app).post('/api/auth/login').send({ username, password }).expect(200);
  const token: string = login.body.data.accessToken;

  const { file, name } = tempTextFile(content);
  const upload = await request(app)
    .post('/api/docs')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', file, { filename: name, contentType: 'text/plain' })
    .field('title', title)
    .field('password', password)
    .expect(201);

  return { docId: upload.body.data.documentId, token, username, file, name };
}

beforeEach(async () => {
  app = await freshApp();
});

describe('API /api/verify', () => {
  it('verifica como VALID un archivo íntegro', async () => {
    const { docId, file, name } = await uploadDoc('contenido íntegro a verificar');

    const res = await request(app)
      .post('/api/verify')
      .field('documentId', docId)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .expect(200);

    expect(res.body.data.status).toBe('VALID');
    expect(res.body.data.verification.hashMatch).toBe(true);
    expect(res.body.data.verification.signatureValid).toBe(true);
    expect(res.body.data.document.id).toBe(docId);
  });

  it('detecta MANIPULATED si el contenido cambió', async () => {
    const { docId } = await uploadDoc('contenido original');
    const { file, name } = tempTextFile('contenido MODIFICADO por atacante');

    const res = await request(app)
      .post('/api/verify')
      .field('documentId', docId)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .expect(200);

    expect(res.body.data.status).toBe('MANIPULATED');
    expect(res.body.data.verification.hashMatch).toBe(false);
  });

  it('localiza coincidencias por hash sin indicar documento', async () => {
    const { file, name } = await uploadDoc('documento con hash único');

    const res = await request(app)
      .post('/api/verify')
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .expect(200);

    expect(res.body.data.status).toBe('FOUND');
    expect(res.body.data.matches).toHaveLength(1);
  });

  it('reporta NOT_FOUND para documentos desconocidos', async () => {
    const { file, name } = tempTextFile('nada');
    const res = await request(app)
      .post('/api/verify')
      .field('documentId', 'id-inexistente')
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .expect(404);

    expect(res.body.data.status).toBe('NOT_FOUND');
  });

  it('devuelve la información pública de verificación de un documento', async () => {
    const { docId, username } = await uploadDoc('contenido para escanear');

    const res = await request(app).get(`/api/verify/${docId}`).expect(200);
    expect(res.body.data.document.id).toBe(docId);
    expect(res.body.data.document.currentVersion).toBe(1);
    expect(res.body.data.instructions).toBeTruthy();
    void username;

    await request(app).get('/api/verify/inexistente').expect(404);
  });

  it('rechaza la verificación sin archivo', async () => {
    const res = await request(app).post('/api/verify').field('documentId', 'x').expect(400);
    expect(res.body.error).toContain('No se proporcionó archivo');
  });
});