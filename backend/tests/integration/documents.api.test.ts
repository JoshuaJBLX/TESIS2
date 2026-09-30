import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import '../helpers/db.js';
import { freshApp, validPassword } from '../helpers/bootstrap.js';

let app: any;
let seed = 0;
function uname(prefix: string): string {
  seed += 1;
  return `${prefix}${seed}`;
}

async function makeUser(): Promise<{ token: string; username: string; password: string }> {
  const username = uname('usr');
  const password = validPassword('w');
  await request(app)
    .post('/api/auth/register')
    .send({ username, email: `${username}@test.pe`, password, fullName: `Fulano ${username}` })
    .expect(201);
  const login = await request(app).post('/api/auth/login').send({ username, password }).expect(200);
  return { token: login.body.data.accessToken, username, password };
}

function tempTextFile(content: string): { file: Buffer; name: string; asPath: string } {
  const name = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, content, 'utf8');
  return { file: fs.readFileSync(p), name, asPath: p };
}

beforeEach(async () => {
  app = await freshApp();
});

describe('API /api/docs', () => {
  it('exige autenticación para listar documentos', async () => {
    await request(app).get('/api/docs').expect(401);
  });

  it('sube un documento firmado y genera su QR', async () => {
    const { token } = await makeUser();
    const { file, name } = tempTextFile('contenido inicial del contrato');

    const res = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .field('title', 'Contrato Prueba')
      .field('description', 'Descripción')
      .field('changeDescription', 'Versión inicial')
      .field('password', validPassword('w'))
      .expect(201);

    expect(res.body.data.documentId).toBeTruthy();
    expect(res.body.data.versionNumber).toBe(1);
    expect(res.body.data.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(res.body.data.verificationUrl).toContain('/api/verify/');
  });

  it('rechaza la subida sin contraseña de firma', async () => {
    const { token } = await makeUser();
    const { file, name } = tempTextFile('sin password');

    const res = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .field('title', 'Sin Password')
      .expect(400);

    expect(res.body.error).toContain('Título y contraseña son requeridos');
  });

  it('rechaza tipos de archivo no permitidos', async () => {
    const { token } = await makeUser();
    const bad = Buffer.from('#!/bin/bash\necho hola');

    const res = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', bad, { filename: 'script.sh', contentType: 'application/x-sh' })
      .field('title', 'Script')
      .field('password', validPassword('w'))
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('lista documentos y muestra detalles', async () => {
    const { token } = await makeUser();
    const { file, name } = tempTextFile('contenido');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .field('title', 'Doc Detalle')
      .field('password', validPassword('w'))
      .expect(201);

    const docId = upload.body.data.documentId;

    const list = await request(app).get('/api/docs').set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.data.map((d: any) => d.id)).toContain(docId);

    const detail = await request(app).get(`/api/docs/${docId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(detail.body.data.title).toBe('Doc Detalle');
    expect(detail.body.data.latestVersion.version_number).toBe(1);
  });

  it('crea la versión 2 al actualizar el documento', async () => {
    const { token } = await makeUser();
    const v1 = tempTextFile('base');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', v1.file, { filename: v1.name, contentType: 'text/plain' })
      .field('title', 'Evolutivo')
      .field('password', validPassword('w'))
      .expect(201);
    const docId = upload.body.data.documentId;

    const v2 = tempTextFile('version nueva con cambios');
    const updated = await request(app)
      .put(`/api/docs/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', v2.file, { filename: v2.name, contentType: 'text/plain' })
      .field('changeDescription', 'Cláusula 10 modificada')
      .field('password', validPassword('w'))
      .expect(200);

    expect(updated.body.data.versionNumber).toBe(2);

    const versions = await request(app).get(`/api/docs/${docId}/versions`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(versions.body.data).toHaveLength(2);
    expect(versions.body.data[0].version_number).toBe(2);
  });

  it('descarga el archivo de una versión con autenticación', async () => {
    const { token } = await makeUser();
    const { file, name } = tempTextFile('archivo descargable único');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .field('title', 'Descarga')
      .field('password', validPassword('w'))
      .expect(201);
    const docId = upload.body.data.documentId;

    const res = await request(app).get(`/api/docs/${docId}/file`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.text).toBe('archivo descargable único');
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('bloquea la descarga de documentos privados ajenos', async () => {
    const owner = await makeUser();
    const { file, name } = tempTextFile('privado');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${owner.token}`)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .field('title', 'Privado')
      .field('password', owner.password)
      .expect(201);

    const stranger = await makeUser();
    const res = await request(app)
      .get(`/api/docs/${upload.body.data.documentId}/file`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect([401, 403]).toContain(res.status);

    // Sin token también se bloquea
    const anon = await request(app).get(`/api/docs/${upload.body.data.documentId}/file`);
    expect([401, 403]).toContain(anon.status);
  });

  it('comparte un documento y lo expone en el perfil público', async () => {
    const owner = await makeUser();
    const { file, name } = tempTextFile('compartido');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${owner.token}`)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .field('title', 'Público')
      .field('password', owner.password)
      .expect(201);
    const docId = upload.body.data.documentId;

    const hidden = await request(app).get(`/api/users/${owner.username}`).expect(200);
    expect(hidden.body.data.documents).toHaveLength(0);

    const vis = await request(app)
      .patch(`/api/docs/${docId}/visibility`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ isPublic: true })
      .expect(200);
    expect(vis.body.data.isPublic).toBe(1);

    const pub = await request(app).get(`/api/users/${owner.username}`).expect(200);
    expect(pub.body.data.documents.map((d: any) => d.id)).toContain(docId);

    // Un extraño ya puede descargar el archivo público
    const stranger = await makeUser();
    const download = await request(app).get(`/api/docs/${docId}/file`).set('Authorization', `Bearer ${stranger.token}`).expect(200);
    expect(download.text).toBe('compartido');
  });

  it('prohibe compartir documentos ajenos', async () => {
    const owner = await makeUser();
    const { file, name } = tempTextFile('ajeno');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${owner.token}`)
      .attach('file', file, { filename: name, contentType: 'text/plain' })
      .field('title', 'Ajeno')
      .field('password', owner.password)
      .expect(201);

    const stranger = await makeUser();
    const res = await request(app)
      .patch(`/api/docs/${upload.body.data.documentId}/visibility`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ isPublic: true })
      .expect(400);

    expect(res.body.error).toContain('No tienes permisos');
  });

  it('gestiona propuestas: crear, rechazar y aceptar', async () => {
    const owner = await makeUser();
    const author = await makeUser();

    const base = tempTextFile('versión base');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${owner.token}`)
      .attach('file', base.file, { filename: base.name, contentType: 'text/plain' })
      .field('title', 'Colaborativo')
      .field('password', owner.password)
      .expect(201);
    const docId = upload.body.data.documentId;

    // El documento debe ser público para aceptar propuestas
    await request(app).patch(`/api/docs/${docId}/visibility`).set('Authorization', `Bearer ${owner.token}`).send({ isPublic: true }).expect(200);

    // Propuesta rechazada
    const p1 = tempTextFile('propuesta 1');
    const prop1 = await request(app)
      .post(`/api/docs/${docId}/proposals`)
      .set('Authorization', `Bearer ${author.token}`)
      .attach('file', p1.file, { filename: p1.name, contentType: 'text/plain' })
      .field('changeDescription', 'Propongo sección 1')
      .field('password', author.password)
      .expect(201);
    const prop1Id = prop1.body.data.proposalId;

    const reject = await request(app)
      .post(`/api/docs/${docId}/proposals/${prop1Id}/reject`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(reject.body.success).toBe(true);

    // Propuesta aceptada → nueva versión con coautor
    const p2 = tempTextFile('propuesta aceptada');
    const prop2 = await request(app)
      .post(`/api/docs/${docId}/proposals`)
      .set('Authorization', `Bearer ${author.token}`)
      .attach('file', p2.file, { filename: p2.name, contentType: 'text/plain' })
      .field('changeDescription', 'Propongo sección 2')
      .field('password', author.password)
      .expect(201);
    const prop2Id = prop2.body.data.proposalId;

    const accept = await request(app)
      .post(`/api/docs/${docId}/proposals/${prop2Id}/accept`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ password: owner.password })
      .expect(200);
    expect(accept.body.data.versionNumber).toBe(2);
    expect(accept.body.data.coauthorUsername).toBe(author.username);

    const proposals = await request(app).get(`/api/docs/${docId}/proposals`).set('Authorization', `Bearer ${owner.token}`).expect(200);
    const byId = Object.fromEntries(proposals.body.data.map((p: any) => [p.id, p]));
    expect(byId[prop1Id].status).toBe('rejected');
    expect(byId[prop2Id].status).toBe('accepted');

    // El proponente puede descargar su propuesta
    const dl = await request(app).get(`/api/docs/${docId}/proposals/${prop2Id}/file`).set('Authorization', `Bearer ${author.token}`).expect(200);
    expect(dl.text).toBe('propuesta aceptada');
  });

  it('no permite propuestas en documentos privados', async () => {
    const owner = await makeUser();
    const author = await makeUser();
    const base = tempTextFile('privado');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${owner.token}`)
      .attach('file', base.file, { filename: base.name, contentType: 'text/plain' })
      .field('title', 'Privado')
      .field('password', owner.password)
      .expect(201);

    const p = tempTextFile('propuesta');
    const res = await request(app)
      .post(`/api/docs/${upload.body.data.documentId}/proposals`)
      .set('Authorization', `Bearer ${author.token}`)
      .attach('file', p.file, { filename: p.name, contentType: 'text/plain' })
      .field('changeDescription', 'x')
      .field('password', author.password)
      .expect(400);

    expect(res.body.error).toContain('no esta compartido');
  });

  it('compara versiones de texto', async () => {
    const { token } = await makeUser();
    const v1 = tempTextFile('a\nb\nc');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', v1.file, { filename: v1.name, contentType: 'text/plain' })
      .field('title', 'Comparable')
      .field('password', validPassword('w'))
      .expect(201);
    const docId = upload.body.data.documentId;
    const v1Id = upload.body.data.versionId;

    const v2 = tempTextFile('a\nb\nc\nEXTRA');
    const updated = await request(app)
      .put(`/api/docs/${docId}`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', v2.file, { filename: v2.name, contentType: 'text/plain' })
      .field('changeDescription', 'añadida línea EXTRA')
      .field('password', validPassword('w'))
      .expect(200);
    const v2Id = updated.body.data.versionId;

    const res = await request(app)
      .get(`/api/docs/${docId}/compare`)
      .set('Authorization', `Bearer ${token}`)
      .query({ sourceType: 'version', sourceId: v1Id, targetType: 'version', targetId: v2Id })
      .expect(200);

    expect(res.body.data.supported).toBe(true);
    expect(res.body.data.summary.additions).toBe(1);
  });
});