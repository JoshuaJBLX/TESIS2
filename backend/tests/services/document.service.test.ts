import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import '../helpers/db.js';
import { freshBackend, validPassword } from '../helpers/bootstrap.js';
import { makeTempFile, trackUploadedFile } from '../helpers/db.js';

let uid = 0;
function nextName(prefix: string): string {
  uid += 1;
  return `${prefix}-${uid}`;
}

describe('DocumentService', () => {
  let backend: Awaited<ReturnType<typeof freshBackend>>;
  let owner: Awaited<ReturnType<typeof backend.authService.register>>;
  let author: Awaited<ReturnType<typeof backend.authService.register>>;
  let ownerPassword: string;
  let authorPassword: string;

  beforeEach(async () => {
    backend = await freshBackend();
    ownerPassword = validPassword('owner');
    authorPassword = validPassword('author');
    owner = await backend.authService.register({ username: nextName('owner'), email: `${nextName('o')}@test.pe`, password: ownerPassword, fullName: 'Dueño' });
    author = await backend.authService.register({ username: nextName('author'), email: `${nextName('a')}@test.pe`, password: authorPassword, fullName: 'Proponente' });
  });

  async function uploadDoc(content: string, title: string): Promise<Awaited<ReturnType<typeof backend.documentService.uploadDocument>>> {
    const fileName = `${nextName('doc')}.txt`;
    const file = makeTempFile(fileName, content);
    const result = await backend.documentService.uploadDocument(file, fileName, 'text/plain', fs.statSync(file).size, title, null, 'Versión inicial', owner.userId, ownerPassword);
    trackUploadedFile(path.join('uploads', `${result.versionId}-${fileName}`));
    return result;
  }

  it('sube un documento, lo firma y crea la versión 1', async () => {
    const { documentService, query } = backend;
    const result = await uploadDoc('contenido del contrato', 'Contrato Uno');

    expect(result.documentId).toBeTruthy();
    expect(result.versionId).toBeTruthy();
    expect(result.versionNumber).toBe(1);
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.signature.algorithm).toBe('RSA-SHA256');

    const doc = documentService.getDocument(result.documentId, owner.userId) as any;
    expect(doc.title).toBe('Contrato Uno');
    expect(doc.latestVersion.version_number).toBe(1);

    const docs = documentService.getDocuments(owner.userId) as any[];
    expect(docs.map((d) => d.id)).toContain(result.documentId);

    const sig = query.queryOne('SELECT * FROM document_signatures WHERE version_id = ?', [result.versionId]) as any;
    expect(sig.signer_id).toBe(owner.userId);
  });

  it('rechaza subir un documento con contraseña equivocada', async () => {
    const { documentService } = backend;
    const fileName = `${nextName('doc')}.txt`;
    const file = makeTempFile(fileName, 'contenido');
    await expect(
      documentService.uploadDocument(file, fileName, 'text/plain', fs.statSync(file).size, 'Título', null, 'v1', owner.userId, 'ConstrasenaEquivocada!')
    ).rejects.toThrow();
  });

  it('crea la version 2 al actualizar y mantiene el historial', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('version uno del doc', 'Doc Historial');

    const v2Name = `${nextName('doc')}.txt`;
    const v2File = makeTempFile(v2Name, 'version DOS del doc');
    const updated = await documentService.updateDocument(first.documentId, v2File, v2Name, 'text/plain', fs.statSync(v2File).size, 'Ajuste de cláusula 4', owner.userId, ownerPassword);
    trackUploadedFile(path.join('uploads', `${updated.versionId}-${v2Name}`));

    expect(updated.versionNumber).toBe(2);
    const doc = documentService.getDocument(first.documentId, owner.userId) as any;
    expect(doc.latestVersion.version_number).toBe(2);

    const versions = documentService.getDocumentVersions(first.documentId, owner.userId) as any[];
    expect(versions).toHaveLength(2);
    expect(versions[0].version_number).toBe(2);
    expect(versions[1].change_description).toBe('Versión inicial');
  });

  it('solo el propietario puede actualizar documentos privados', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('contenido base', 'Restringido');

    const v2File = makeTempFile(`${nextName('doc')}.txt`, 'intento ajeno');
    await expect(
      documentService.updateDocument(first.documentId, v2File, 'otro.txt', 'text/plain', fs.statSync(v2File).size, 'cambio', author.userId, authorPassword)
    ).rejects.toThrow('No tienes permisos');

    await expect(
      documentService.updateDocument('id-inexistente', makeTempFile('x.txt', 'x'), 'x.txt', 'text/plain', 1, 'x', owner.userId, ownerPassword)
    ).rejects.toThrow('Documento no encontrado');
  });

  it('resuelve el archivo de una versión y valida permisos de descarga', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('firma digital integradora', 'Para Descargar');

    const latest = documentService.resolveVersionFile(first.documentId, undefined, owner.userId);
    expect(fs.existsSync(latest.filePath)).toBe(true);
    expect(fs.readFileSync(latest.filePath, 'utf8')).toBe('firma digital integradora');
    expect(latest.fileName).toContain('.txt');

    // Un ajeno no puede descargar si el documento es privado
    expect(() => documentService.resolveVersionFile(first.documentId, undefined, author.userId)).toThrow('No tienes permisos');

    // Es posible descargar una versión específica por id
    const specific = documentService.resolveVersionFile(first.documentId, first.versionId, owner.userId);
    expect(specific.filePath).toBe(latest.filePath);
  });

  it('comparte y deja de compartir documentos', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('documento compartible', 'Compartir');

    const vis = await documentService.setDocumentVisibility(first.documentId, owner.userId, true);
    expect(vis.isPublic).toBe(1);

    const profile = documentService.getPublicProfile(owner.username) as any;
    expect(profile.user.username).toBe(owner.username);
    expect(profile.documents.map((d: any) => d.id)).toContain(first.documentId);

    await documentService.setDocumentVisibility(first.documentId, owner.userId, false);
    const after = documentService.getPublicProfile(owner.username) as any;
    expect(after.documents.map((d: any) => d.id)).not.toContain(first.documentId);

    await expect(documentService.setDocumentVisibility(first.documentId, author.userId, true)).rejects.toThrow('No tienes permisos');
  });

  it('solo acepta propuestas en documentos públicos', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('documento privado', 'Sin Propuestas');
    await expect(
      documentService.createProposal(first.documentId, makeTempFile('p.txt', 'x'), 'p.txt', 'text/plain', 1, 'cambio', author.userId, authorPassword)
    ).rejects.toThrow('no esta compartido');
  });

  it('crea, acepta y rechaza propuestas firmadas', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('version base para propuestas', 'Colaborativo');
    await documentService.setDocumentVisibility(first.documentId, owner.userId, true);

    // Propuesta rechazada
    const p1Name = `${nextName('prop')}.txt`;
    const p1File = makeTempFile(p1Name, 'propuesta una');
    const proposal1 = await documentService.createProposal(first.documentId, p1File, p1Name, 'text/plain', fs.statSync(p1File).size, 'Agregar sección A', author.userId, authorPassword, first.versionId);
    trackUploadedFile(path.join('uploads', 'proposals', `${proposal1.proposalId}-${p1Name}`));
    expect(proposal1.baseVersionId).toBe(first.versionId);

    await documentService.rejectProposal(first.documentId, proposal1.proposalId, owner.userId);
    await expect(
      documentService.acceptProposal(first.documentId, proposal1.proposalId, owner.userId, ownerPassword)
    ).rejects.toThrow('ya fue procesada');

    // Propuesta aceptada
    const p2Name = `${nextName('prop')}.txt`;
    const p2File = makeTempFile(p2Name, 'propuesta aprobada');
    const proposal2 = await documentService.createProposal(first.documentId, p2File, p2Name, 'text/plain', fs.statSync(p2File).size, 'Agregar sección B', author.userId, authorPassword, first.versionId);
    trackUploadedFile(path.join('uploads', 'proposals', `${proposal2.proposalId}-${p2Name}`));

    const accepted = await documentService.acceptProposal(first.documentId, proposal2.proposalId, owner.userId, ownerPassword);
    trackUploadedFile(path.join('uploads', `${accepted.versionId}-${p2Name}`));

    expect(accepted.versionNumber).toBe(2);
    expect(accepted.coauthorUsername).toBe(author.username);

    const proposals = documentService.getDocumentProposals(first.documentId, owner.userId) as any[];
    const byId = Object.fromEntries(proposals.map((p: any) => [p.id, p]));
    expect(byId[proposal1.proposalId].status).toBe('rejected');
    expect(byId[proposal2.proposalId].status).toBe('accepted');

    // La nueva versión hereda al coautor y la referencia a la propuesta
    const versions = documentService.getDocumentVersions(first.documentId, owner.userId) as any[];
    const v2 = versions.find((v: any) => v.version_number === 2) as any;
    expect(v2.coauthor_username).toBe(author.username);
    expect(v2.source_proposal_id).toBe(proposal2.proposalId);

    // El proponente puede descargar su propia propuesta
    const proposalFile = documentService.resolveProposalFile(first.documentId, proposal2.proposalId, author.userId);
    expect(fs.existsSync(proposalFile.filePath)).toBe(true);
  });

  it('un tercero puede descargar propuestas de documentos públicos', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('base publica', 'Publica');
    await documentService.setDocumentVisibility(first.documentId, owner.userId, true);
    const pName = `${nextName('prop')}.txt`;
    const pFile = makeTempFile(pName, 'contenido');
    const proposal = await documentService.createProposal(first.documentId, pFile, pName, 'text/plain', fs.statSync(pFile).size, 'cambio', author.userId, authorPassword, first.versionId);
    trackUploadedFile(path.join('uploads', 'proposals', `${proposal.proposalId}-${pName}`));

    const third = await backend.authService.register({ username: nextName('tercero'), email: `${nextName('t')}@test.pe`, password: validPassword('third'), fullName: 'Tercero' });

    // Acceso público: el tercero (no proponente) puede descargar el archivo
    const file = documentService.resolveProposalFile(first.documentId, proposal.proposalId, third.userId);
    expect(fs.existsSync(file.filePath)).toBe(true);

    // Sin autenticación y sin relación también es accesible por ser público
    expect(() => documentService.resolveProposalFile(first.documentId, 'propuesta-inexistente', third.userId)).toThrow('Propuesta no encontrada');
  });

  it('compara dos versiones de un documento de texto', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('clausula uno\nclausula dos', 'Comparable');
    const v2Name = `${nextName('doc')}.txt`;
    const v2File = makeTempFile(v2Name, 'clausula uno\nclausula NUEVA');
    const second = await documentService.updateDocument(first.documentId, v2File, v2Name, 'text/plain', fs.statSync(v2File).size, 'cambio', owner.userId, ownerPassword);
    trackUploadedFile(path.join('uploads', `${second.versionId}-${v2Name}`));

    const comparison = documentService.compareDocumentArtifacts(
      first.documentId,
      'version', first.versionId,
      'version', second.versionId,
      owner.userId
    );
    expect(comparison.supported).toBe(true);
    expect(comparison.summary.textReady).toBe(true);
    expect(comparison.base.versionNumber).toBe(1);
    expect(comparison.target.versionNumber).toBe(2);
    expect(comparison.metadata.some((m) => m.field === 'content_hash')).toBe(true);
  });

  it('niega comparaciones entre artefactos inexistentes', async () => {
    const { documentService } = backend;
    const first = await uploadDoc('algo', 'Hallazgos');
    expect(() =>
      documentService.compareDocumentArtifacts(first.documentId, 'version', first.versionId, 'version', 'id-falso', owner.userId)
    ).toThrow('No se pudo encontrar');
  });
});