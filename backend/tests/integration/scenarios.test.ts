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

async function makeUser(prefix = 'user'): Promise<{ token: string; username: string; password: string }> {
  const username = uname(prefix);
  const password = validPassword(prefix);
  await request(app)
    .post('/api/auth/register')
    .send({ username, email: `${username}@test.pe`, password, fullName: `Usuario ${username}` })
    .expect(201);
  const login = await request(app).post('/api/auth/login').send({ username, password }).expect(200);
  return { token: login.body.data.accessToken, username, password };
}

async function makeAdmin(): Promise<{ token: string; username: string; password: string }> {
  const user = await makeUser('adm');
  const connection = await import('../../src/db/connection.js');
  connection.getDatabase().run('UPDATE users SET role = ? WHERE username = ?', ['admin', user.username]);
  const login = await request(app).post('/api/auth/login').send({ username: user.username, password: user.password }).expect(200);
  return { token: login.body.data.accessToken, username: user.username, password: user.password };
}

function tempTextFile(content: string): { file: Buffer; name: string } {
  const name = `scen-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  const p = path.join(os.tmpdir(), name);
  fs.writeFileSync(p, content, 'utf8');
  return { file: fs.readFileSync(p), name };
}

async function uploadDoc(
  token: string,
  password: string,
  opts: { title: string; content: string; description?: string; changeDescription?: string }
): Promise<{ docId: string; versionId: string; versionNumber: number }> {
  const { file, name } = tempTextFile(opts.content);
  const res = await request(app)
    .post('/api/docs')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', file, { filename: name, contentType: 'text/plain' })
    .field('title', opts.title)
    .field('description', opts.description || '')
    .field('changeDescription', opts.changeDescription || 'Versión inicial')
    .field('password', password)
    .expect(201);
  return {
    docId: res.body.data.documentId,
    versionId: res.body.data.versionId,
    versionNumber: res.body.data.versionNumber
  };
}

async function updateDoc(
  token: string,
  password: string,
  docId: string,
  opts: { content: string; changeDescription: string }
): Promise<{ versionId: string; versionNumber: number }> {
  const { file, name } = tempTextFile(opts.content);
  const res = await request(app)
    .put(`/api/docs/${docId}`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', file, { filename: name, contentType: 'text/plain' })
    .field('changeDescription', opts.changeDescription)
    .field('password', password)
    .expect(200);
  return { versionId: res.body.data.versionId, versionNumber: res.body.data.versionNumber };
}

beforeEach(async () => {
  app = await freshApp();
});

describe('Escenarios end-to-end multi-usuario', () => {
  it('1) Evolución completa de un documento a través de 3 versiones', async () => {
    const owner = await makeUser('alice');

    const v1 = await uploadDoc(owner.token, owner.password, {
      title: 'Contrato Marco',
      content: 'Cláusula 1\nCláusula 2\nCláusula 3',
      changeDescription: 'Borrador inicial'
    });
    expect(v1.versionNumber).toBe(1);

    const v2 = await updateDoc(owner.token, owner.password, v1.docId, {
      content: 'Cláusula 1\nCláusula 2 MODIFICADA\nCláusula 3',
      changeDescription: 'Revisión jurídica de cláusula 2'
    });
    expect(v2.versionNumber).toBe(2);

    const v3 = await updateDoc(owner.token, owner.password, v1.docId, {
      content: 'Cláusula 1\nCláusula 2 FINAL\nCláusula 3\nCláusula 4 (anexo)',
      changeDescription: 'Añadida cláusula 4 y texto final'
    });
    expect(v3.versionNumber).toBe(3);

    // El historial muestra las 3 versiones de la más reciente a la más antigua
    const versions = await request(app)
      .get(`/api/docs/${v1.docId}/versions`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(versions.body.data).toHaveLength(3);
    expect(versions.body.data.map((v: any) => v.version_number)).toEqual([3, 2, 1]);

    // Los hashes de cada versión son distintos (el contenido cambió)
    const hashes = new Set(versions.body.data.map((v: any) => v.content_hash));
    expect(hashes.size).toBe(3);

    // Cada versión conserva su propio contenido al descargarla
    const dlV1 = await request(app)
      .get(`/api/docs/${v1.docId}/file?versionId=${v1.versionId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(dlV1.text).toContain('Cláusula 2');
    expect(dlV1.text).not.toContain('FINAL');

    const dlV3 = await request(app)
      .get(`/api/docs/${v1.docId}/file?versionId=${v3.versionId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(dlV3.text).toContain('Cláusula 4 (anexo)');

    // Comparación v1 → v3: hubo 1 edición y 1 adición de línea
    const cmp = await request(app)
      .get(`/api/docs/${v1.docId}/compare`)
      .set('Authorization', `Bearer ${owner.token}`)
      .query({ sourceType: 'version', sourceId: v1.versionId, targetType: 'version', targetId: v3.versionId })
      .expect(200);
    expect(cmp.body.data.supported).toBe(true);
    expect(cmp.body.data.summary.deletions).toBeGreaterThan(0);
    expect(cmp.body.data.summary.additions).toBeGreaterThan(0);

    // Detalle del documento refleja la versión actual
    const detail = await request(app)
      .get(`/api/docs/${v1.docId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(detail.body.data.latestVersion.version_number).toBe(3);
  });

  it('2) Colaboración con coautor: propuestas creadas, rechazadas y aceptadas como versión 2', async () => {
    const owner = await makeUser('jefe');
    const reviewer = await makeUser('revisor');

    const base = tempTextFile('Informe técnico\nSección A\nSección B');
    const upload = await request(app)
      .post('/api/docs')
      .set('Authorization', `Bearer ${owner.token}`)
      .attach('file', base.file, { filename: base.name, contentType: 'text/plain' })
      .field('title', 'Informe Q3')
      .field('description', 'Informe trimestral')
      .field('changeDescription', 'Plantilla inicial')
      .field('password', owner.password)
      .expect(201);
    const docId = upload.body.data.documentId;
    const baseVersionId = upload.body.data.versionId;

    // Debe ser público para que otros puedan proponer
    await request(app)
      .patch(`/api/docs/${docId}/visibility`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ isPublic: true })
      .expect(200);

    // Propuesta rechazada por el propietario
    const pRej = tempTextFile('Informe técnico\nSección A\nSección B\nSección C (borrador)');
    const propRej = await request(app)
      .post(`/api/docs/${docId}/proposals`)
      .set('Authorization', `Bearer ${reviewer.token}`)
      .attach('file', pRej.file, { filename: pRej.name, contentType: 'text/plain' })
      .field('changeDescription', 'Borrador sección C')
      .field('password', reviewer.password)
      .expect(201);

    await request(app)
      .post(`/api/docs/${docId}/proposals/${propRej.body.data.proposalId}/reject`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    // Propuesta aceptada → genera coautoría y versión 2
    const pAce = tempTextFile('Informe técnico\nSección A\nSección B\nSección C definitiva');
    const propAce = await request(app)
      .post(`/api/docs/${docId}/proposals`)
      .set('Authorization', `Bearer ${reviewer.token}`)
      .attach('file', pAce.file, { filename: pAce.name, contentType: 'text/plain' })
      .field('changeDescription', 'Sección C final validada')
      .field('password', reviewer.password)
      .expect(201);

    const accept = await request(app)
      .post(`/api/docs/${docId}/proposals/${propAce.body.data.proposalId}/accept`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ password: owner.password })
      .expect(200);
    expect(accept.body.data.versionNumber).toBe(2);
    expect(accept.body.data.coauthorUsername).toBe(reviewer.username);

    // El historial ahora tiene 2 versiones; la 2ª es firmada por el propietario
    // y deja registrado al coautor que aportó los cambios
    const versions = await request(app)
      .get(`/api/docs/${docId}/versions`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(versions.body.data).toHaveLength(2);
    expect(versions.body.data[0].version_number).toBe(2);
    expect(versions.body.data[0].signer_username).toBe(owner.username);
    expect(versions.body.data[0].coauthor_username).toBe(reviewer.username);
    expect(versions.body.data[1].version_number).toBe(1);
    expect(versions.body.data[1].signer_username).toBe(owner.username);
    expect(versions.body.data[1].coauthor_username).toBeNull();

    // Comparación entre la versión base y la aceptada
    const cmp = await request(app)
      .get(`/api/docs/${docId}/compare`)
      .set('Authorization', `Bearer ${owner.token}`)
      .query({ sourceType: 'version', sourceId: baseVersionId, targetType: 'version', targetId: accept.body.data.versionId })
      .expect(200);
    expect(cmp.body.data.summary.additions).toBeGreaterThan(0);

    // Estado final de las propuestas
    const proposals = await request(app)
      .get(`/api/docs/${docId}/proposals`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    const byId = Object.fromEntries(proposals.body.data.map((p: any) => [p.id, p]));
    expect(byId[propRej.body.data.proposalId].status).toBe('rejected');
    expect(byId[propAce.body.data.proposalId].status).toBe('accepted');
  });

  it('3) Ciclo de vida con varios usuarios: privado → público → propuesta → nueva versión', async () => {
    const alice = await makeUser('alice');
    const bob = await makeUser('bob');
    const carol = await makeUser('carol');

    // Alice crea un documento privado
    const v1 = await uploadDoc(alice.token, alice.password, {
      title: 'Lineamientos',
      content: 'v1: lineamientos generales'
    });
    const docId = v1.docId;

    // Bob (tercero) no puede descargarlo ni actualizarlo mientras es privado
    const blockedDownload = await request(app)
      .get(`/api/docs/${docId}/file`)
      .set('Authorization', `Bearer ${bob.token}`);
    expect([401, 403]).toContain(blockedDownload.status);

    const blockedUpdate = await request(app)
      .put(`/api/docs/${docId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .attach('file', tempTextFile('no debe entrar').file, { filename: 'x.txt', contentType: 'text/plain' })
      .field('changeDescription', 'intrusión')
      .field('password', bob.password);
    expect([401, 403, 400]).toContain(blockedUpdate.status);

    // Alice comparte el documento públicamente
    await request(app)
      .patch(`/api/docs/${docId}/visibility`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ isPublic: true })
      .expect(200);

    // Ahora Carol puede descargarlo
    const publicDownload = await request(app)
      .get(`/api/docs/${docId}/file`)
      .set('Authorization', `Bearer ${carol.token}`)
      .expect(200);
    expect(publicDownload.text).toBe('v1: lineamientos generales');

    // Carol propone una mejora, Bob propone otra
    const pCarol = tempTextFile('v1: lineamientos generales\nv2: política de accesos');
    const proposal = await request(app)
      .post(`/api/docs/${docId}/proposals`)
      .set('Authorization', `Bearer ${carol.token}`)
      .attach('file', pCarol.file, { filename: pCarol.name, contentType: 'text/plain' })
      .field('changeDescription', 'Añadir política de accesos')
      .field('password', carol.password)
      .expect(201);

    const pBob = tempTextFile('v1: lineamientos generales\nv2: política de backups');
    await request(app)
      .post(`/api/docs/${docId}/proposals`)
      .set('Authorization', `Bearer ${bob.token}`)
      .attach('file', pBob.file, { filename: pBob.name, contentType: 'text/plain' })
      .field('changeDescription', 'Añadir política de backups')
      .field('password', bob.password)
      .expect(201);

    // Alice acepta la de Carol y rechaza la de Bob
    const accept = await request(app)
      .post(`/api/docs/${docId}/proposals/${proposal.body.data.proposalId}/accept`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ password: alice.password })
      .expect(200);
    expect(accept.body.data.versionNumber).toBe(2);
    expect(accept.body.data.coauthorUsername).toBe(carol.username);

    // El documento ahora tiene 2 versiones; la 2ª reconoce a Carol como coautora
    const versions = await request(app)
      .get(`/api/docs/${docId}/versions`)
      .set('Authorization', `Bearer ${alice.token}`)
      .expect(200);
    expect(versions.body.data).toHaveLength(2);
    const ver1 = versions.body.data.find((v: any) => v.version_number === 1);
    const ver2 = versions.body.data.find((v: any) => v.version_number === 2);
    expect(ver1.signer_username).toBe(alice.username);
    expect(ver1.coauthor_username).toBeNull();
    expect(ver2.signer_username).toBe(alice.username);
    expect(ver2.coauthor_username).toBe(carol.username);

    // El detalle público muestra la versión 2
    const pub = await request(app).get(`/api/users/${alice.username}`).expect(200);
    const found = pub.body.data.documents.find((d: any) => d.id === docId);
    expect(found.latest_version_number).toBe(2);
  });

  it('4) El administrador audita toda la actividad y verifica la cadena', async () => {
    const admin = await makeAdmin();
    const userA = await makeUser('obra');
    const userB = await makeUser('proveedor');

    // Actividad: subidas, actualización y un intento de login fallido
    const doc = await uploadDoc(userA.token, userA.password, { title: 'Obra Pública', content: 'especificaciones' });
    await updateDoc(userA.token, userA.password, doc.docId, {
      content: 'especificaciones v2',
      changeDescription: 'Actualizado presupuesto'
    });
    await request(app).post('/api/auth/login').send({ username: userB.username, password: 'ClaveIncorrecta1!' }).expect(401);

    // El administrador ve eventos de todos los usuarios
    const audit = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${admin.token}`)
      .query({ limit: 200 })
      .expect(200);
    expect(audit.body.data.length).toBeGreaterThan(0);

    const usernames = new Set<string>();
    for (const e of audit.body.data) {
      if (e.event_data) usernames.add(JSON.parse(e.event_data).username || '');
    }
    expect(usernames).toContain(userA.username);
    expect(usernames).toContain(userB.username);

    // Filtro por tipo de evento
    const uploads = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${admin.token}`)
      .query({ eventType: 'DOCUMENT_UPLOAD' })
      .expect(200);
    expect(uploads.body.data.length).toBeGreaterThanOrEqual(1);
    expect(uploads.body.data.every((e: any) => e.event_type === 'DOCUMENT_UPLOAD')).toBe(true);

    const updates = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${admin.token}`)
      .query({ eventType: 'DOCUMENT_UPDATE' })
      .expect(200);
    expect(updates.body.data.length).toBeGreaterThanOrEqual(1);

    // El login fallido quedó registrado
    const failures = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${admin.token}`)
      .query({ eventType: 'LOGIN_FAILED' })
      .expect(200);
    expect(failures.body.data.some((e: any) => JSON.parse(e.event_data).username === userB.username)).toBe(true);

    // La cadena de auditoría es íntegra
    const chain = await request(app)
      .get('/api/audit/verify-chain')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
    expect(chain.body.data.valid).toBe(true);
    expect(chain.body.data.entries).toBe(audit.body.data.length);
    expect(chain.body.data.brokenAt).toBeNull();
  });

  it('5) Permisos: un documento ajeno no puede modificarse ni compartirse', async () => {
    const owner = await makeUser('dueno');
    const stranger = await makeUser('intruso');

    const v1 = await uploadDoc(owner.token, owner.password, {
      title: 'Reservado',
      content: 'contenido confidencial'
    });
    const docId = v1.docId;

    // Un tercero no puede cambiar la visibilidad
    const vis = await request(app)
      .patch(`/api/docs/${docId}/visibility`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ isPublic: true })
      .expect(400);
    expect(vis.body.error).toContain('No tienes permisos');

    // Un tercero no puede aceptar/rechazar propuestas ni verlas
    const strangerProposals = await request(app)
      .get(`/api/docs/${docId}/proposals`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .expect(200);
    expect(strangerProposals.body.data).toHaveLength(0);

    // Un tercero no puede descargar mientras es privado
    await request(app)
      .get(`/api/docs/${docId}/file`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .expect([401, 403]);

    // El propietario sigue teniendo acceso total
    await request(app)
      .get(`/api/docs/${docId}/file`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    // El documento NO aparece en el perfil público del propietario
    const profile = await request(app).get(`/api/users/${owner.username}`).expect(200);
    expect(profile.body.data.documents).toHaveLength(0);

    // Niega la comparación a un tercero incluso sobre propuestas ajenas
    const cmp = await request(app)
      .get(`/api/docs/${docId}/compare`)
      .set('Authorization', `Bearer ${stranger.token}`)
      .query({ sourceType: 'version', sourceId: v1.versionId, targetType: 'version', targetId: v1.versionId })
      .expect(400);
    expect(cmp.body.error).toContain('No tienes permisos para comparar');
  });
});