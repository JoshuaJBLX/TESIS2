import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, queryAll, run } from '../db/query.js';
import { saveDatabase } from '../db/connection.js';
import { decryptPrivateKey, unpackEncryptedKey } from '../crypto/keyProtection.js';
import { calculateFileHash, signDocument } from '../crypto/signature.js';
import type { UserKeys } from '../models/types.js';
import { auditService } from './audit.service.js';
import { compareComparableArtifacts, type ComparisonResult, type ComparableArtifact } from './document-analysis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface UploadResult {
  documentId: string;
  versionId: string;
  versionNumber: number;
  contentHash: string;
  signature: {
    algorithm: string;
    signedAt: Date;
  };
}

type ComparisonSourceType = 'version' | 'proposal';

interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  owner_username: string;
  is_public: number;
  created_at: string;
  updated_at: string;
}

interface VersionRecord {
  id: string;
  document_id: string;
  version_number: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  content_hash: string;
  uploaded_by: string;
  coauthor_id: string | null;
  source_proposal_id: string | null;
  upload_date: string;
  change_description: string | null;
  signer_username: string;
  uploader_username: string;
  coauthor_username: string | null;
  signature_value: string;
  signature_algorithm: string;
  signed_at: string;
}

interface ProposalRecord {
  id: string;
  document_id: string;
  base_version_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  content_hash: string;
  proposed_by: string;
  proposed_by_username: string;
  signature_value: string;
  signature_algorithm: string;
  signed_at: string;
  change_description: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewed_by: string | null;
  reviewed_by_username: string | null;
  reviewed_at: string | null;
  accepted_version_id: string | null;
  created_at: string;
  base_version_number: number;
  base_file_name: string;
  base_content_hash: string;
  base_upload_date: string;
}

function ensureDirectory(folder?: string): string {
  const base = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
  const directory = folder ? path.join(base, folder) : base;
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  return directory;
}

function moveUploadedFile(sourcePath: string, destinationPath: string): void {
  fs.copyFileSync(sourcePath, destinationPath);
  fs.unlinkSync(sourcePath);
}

function isOwnerOrMissing(userId: string | undefined, ownerId: string): boolean {
  return Boolean(userId && userId === ownerId);
}

function toComparableArtifact(data: {
  label: string;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  content_hash: string;
  source_label?: string;
  version_number?: number;
}): ComparableArtifact {
  return {
    label: data.label,
    fileName: data.file_name,
    filePath: data.file_path,
    mimeType: data.mime_type,
    size: Number(data.file_size),
    hash: data.content_hash,
    sourceLabel: data.source_label,
    versionNumber: data.version_number
  };
}

export class DocumentService {
  private getUserKeys(userId: string): UserKeys | null {
    return queryOne('SELECT * FROM user_keys WHERE user_id = ?', [userId]) as UserKeys | null;
  }

  private getDocumentRecord(documentId: string): DocumentRecord | null {
    return queryOne(
      `SELECT d.*, u.username as owner_username
       FROM documents d
       JOIN users u ON d.owner_id = u.id
       WHERE d.id = ?`,
      [documentId]
    ) as DocumentRecord | null;
  }

  private getLatestVersionRecord(documentId: string): VersionRecord | null {
    return queryOne(
      `SELECT dv.*, 
        ds.signature_value, ds.signature_algorithm, ds.signed_at,
        signer.username as signer_username,
        uploader.username as uploader_username,
        coauthor.username as coauthor_username
       FROM document_versions dv
       JOIN document_signatures ds ON ds.version_id = dv.id
       JOIN users signer ON ds.signer_id = signer.id
       JOIN users uploader ON dv.uploaded_by = uploader.id
       LEFT JOIN users coauthor ON dv.coauthor_id = coauthor.id
       WHERE dv.document_id = ?
       ORDER BY dv.version_number DESC
       LIMIT 1`,
      [documentId]
    ) as VersionRecord | null;
  }

  private getVersionRecord(documentId: string, versionId: string): VersionRecord | null {
    return queryOne(
      `SELECT dv.*, 
        ds.signature_value, ds.signature_algorithm, ds.signed_at,
        signer.username as signer_username,
        uploader.username as uploader_username,
        coauthor.username as coauthor_username
       FROM document_versions dv
       JOIN document_signatures ds ON ds.version_id = dv.id
       JOIN users signer ON ds.signer_id = signer.id
       JOIN users uploader ON dv.uploaded_by = uploader.id
       LEFT JOIN users coauthor ON dv.coauthor_id = coauthor.id
       WHERE dv.document_id = ? AND dv.id = ?`,
      [documentId, versionId]
    ) as VersionRecord | null;
  }

  private getProposalRecord(documentId: string, proposalId: string): ProposalRecord | null {
    return queryOne(
      `SELECT dp.*, 
        creator.username as proposed_by_username,
        reviewer.username as reviewed_by_username,
        base.version_number as base_version_number,
        base.file_name as base_file_name,
        base.content_hash as base_content_hash,
        base.upload_date as base_upload_date
       FROM document_proposals dp
       JOIN users creator ON dp.proposed_by = creator.id
       LEFT JOIN users reviewer ON dp.reviewed_by = reviewer.id
       JOIN document_versions base ON dp.base_version_id = base.id
       WHERE dp.document_id = ? AND dp.id = ?`,
      [documentId, proposalId]
    ) as ProposalRecord | null;
  }

  private getUserRole(userId: string): string | null {
    const user = queryOne('SELECT role FROM users WHERE id = ?', [userId]) as { role: string } | null;
    return user?.role || null;
  }

  private signFileForUser(filePath: string, userId: string, userPassword: string) {
    const userKeys = this.getUserKeys(userId);
    if (!userKeys) {
      throw new Error('No se encontraron claves criptograficas para el usuario');
    }

    const encryptedKey = unpackEncryptedKey(userKeys.encrypted_private_key);
    const privateKeyPem = decryptPrivateKey(encryptedKey, userPassword);
    return signDocument(filePath, privateKeyPem);
  }

  private storeOfficialVersion(
    sourcePath: string,
    originalName: string,
    mimeType: string,
    fileSize: number,
    documentId: string,
    title: string,
    description: string | null,
    changeDescription: string | null,
    userId: string,
    signatureSource: { signature: string; algorithm: string; signedAt: Date; contentHash: string },
    coauthorId: string | null,
    sourceProposalId: string | null
  ): UploadResult {
    const versionId = uuidv4();
    const uploadDir = ensureDirectory();
    const permanentPath = path.join(uploadDir, `${versionId}-${originalName}`);

    moveUploadedFile(sourcePath, permanentPath);

    const lastVersion = queryOne(
      'SELECT MAX(version_number) as max_version FROM document_versions WHERE document_id = ?',
      [documentId]
    ) as { max_version: number } | null;
    const versionNumber = ((lastVersion?.max_version || 0) as number) + 1;

    run(
      `INSERT INTO document_versions 
       (id, document_id, version_number, file_name, file_path, file_size, mime_type, content_hash, uploaded_by, coauthor_id, source_proposal_id, change_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        versionId,
        documentId,
        versionNumber,
        originalName,
        permanentPath,
        fileSize,
        mimeType,
        signatureSource.contentHash,
        userId,
        coauthorId,
        sourceProposalId,
        changeDescription
      ]
    );

    const sigId = uuidv4();
    run(
      'INSERT INTO document_signatures (id, version_id, signer_id, signature_value, signature_algorithm, signed_at) VALUES (?, ?, ?, ?, ?, ?)',
      [sigId, versionId, userId, signatureSource.signature, signatureSource.algorithm, signatureSource.signedAt.toISOString()]
    );

    run('UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [documentId]);

    return {
      documentId,
      versionId,
      versionNumber,
      contentHash: signatureSource.contentHash,
      signature: {
        algorithm: signatureSource.algorithm,
        signedAt: signatureSource.signedAt
      }
    };
  }

  async uploadDocument(
    filePath: string,
    originalName: string,
    mimeType: string,
    fileSize: number,
    title: string,
    description: string | null,
    changeDescription: string | null,
    userId: string,
    userPassword: string
  ): Promise<UploadResult> {
    const documentId = uuidv4();
    const signatureSource = this.signFileForUser(filePath, userId, userPassword);

    run(
      'INSERT INTO documents (id, title, description, owner_id, is_public) VALUES (?, ?, ?, ?, ?)',
      [documentId, title, description, userId, 0]
    );

    const result = this.storeOfficialVersion(
      filePath,
      originalName,
      mimeType,
      fileSize,
      documentId,
      title,
      description,
      changeDescription,
      userId,
      signatureSource,
      null,
      null
    );

    auditService.append('DOCUMENT_UPLOAD', 'document', documentId, userId, {
      title,
      version: 1,
      hash: signatureSource.contentHash
    });

    saveDatabase();
    return result;
  }

  async updateDocument(
    documentId: string,
    filePath: string,
    originalName: string,
    mimeType: string,
    fileSize: number,
    changeDescription: string | null,
    userId: string,
    userPassword: string
  ): Promise<UploadResult> {
    const owner = this.getDocumentRecord(documentId);
    if (!owner) {
      throw new Error('Documento no encontrado');
    }
    if (owner.owner_id !== userId) {
      throw new Error('No tienes permisos para modificar este documento');
    }

    const signatureSource = this.signFileForUser(filePath, userId, userPassword);
    const result = this.storeOfficialVersion(
      filePath,
      originalName,
      mimeType,
      fileSize,
      documentId,
      owner.title,
      owner.description,
      changeDescription,
      userId,
      signatureSource,
      null,
      null
    );

    auditService.append('DOCUMENT_UPDATE', 'document', documentId, userId, {
      version: result.versionNumber,
      hash: signatureSource.contentHash,
      changeDescription
    });

    saveDatabase();
    return result;
  }

  async setDocumentVisibility(documentId: string, userId: string, isPublic: boolean): Promise<{ documentId: string; isPublic: number }> {
    const document = this.getDocumentRecord(documentId);
    if (!document) {
      throw new Error('Documento no encontrado');
    }
    if (document.owner_id !== userId) {
      throw new Error('No tienes permisos para compartir este documento');
    }

    run('UPDATE documents SET is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [isPublic ? 1 : 0, documentId]);
    auditService.append('DOCUMENT_VISIBILITY_CHANGED', 'document', documentId, userId, { isPublic });
    saveDatabase();
    return { documentId, isPublic: isPublic ? 1 : 0 };
  }

  getDocuments(userId: string, search?: string): any[] {
    const baseQuery = `SELECT d.*, 
        (SELECT MAX(version_number) FROM document_versions WHERE document_id = d.id) as current_version,
        u.username as owner_username
       FROM documents d
       JOIN users u ON d.owner_id = u.id
       WHERE d.owner_id = ?`;
    
    const params: any[] = [userId];
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      return queryAll(
        `${baseQuery} AND (d.title LIKE ? OR d.description LIKE ? OR u.username LIKE ?)
         ORDER BY d.updated_at DESC`,
        [userId, searchTerm, searchTerm, searchTerm]
      );
    }
    
    return queryAll(
      `${baseQuery} ORDER BY d.updated_at DESC`,
      params
    );
  }

  getDocument(documentId: string, userId?: string): any | null {
    const ownerClause = userId ? ' AND d.owner_id = ?' : '';
    const doc = queryOne(
      `SELECT d.*, u.username as owner_username
       FROM documents d
       JOIN users u ON d.owner_id = u.id
       WHERE d.id = ?${ownerClause}`,
      userId ? [documentId, userId] : [documentId]
    );

    if (!doc) return null;

    const latestVersion = this.getLatestVersionRecord(documentId);
    return { ...doc, latestVersion };
  }

  getDocumentVersions(documentId: string, userId?: string): any[] {
    if (userId && !queryOne('SELECT id FROM documents WHERE id = ? AND owner_id = ?', [documentId, userId])) return [];
    return queryAll(
      `SELECT dv.*, ds.signature_value, ds.signature_algorithm, ds.signed_at,
        u.username as uploader_username,
        su.username as signer_username,
        co.username as coauthor_username
       FROM document_versions dv
       JOIN users u ON dv.uploaded_by = u.id
       LEFT JOIN users co ON dv.coauthor_id = co.id
       LEFT JOIN document_signatures ds ON ds.version_id = dv.id
       LEFT JOIN users su ON ds.signer_id = su.id
       WHERE dv.document_id = ?
       ORDER BY dv.version_number DESC`,
      [documentId]
    );
  }

  getDocumentVersionFile(versionId: string): any | null {
    return queryOne(
      'SELECT * FROM document_versions WHERE id = ?',
      [versionId]
    );
  }

  getSignatureForVersion(versionId: string): any | null {
    return queryOne(
      `SELECT ds.*, u.username as signer_username, uk.public_key
       FROM document_signatures ds
       JOIN users u ON ds.signer_id = u.id
       JOIN user_keys uk ON uk.user_id = ds.signer_id
       WHERE ds.version_id = ?`,
      [versionId]
    );
  }

  getDocumentProposals(documentId: string, userId?: string): any[] {
    const document = this.getDocumentRecord(documentId);
    if (!document) {
      return [];
    }
    if (userId && document.owner_id !== userId) {
      return [];
    }
    return queryAll(
      `SELECT dp.*,
        creator.username as proposed_by_username,
        reviewer.username as reviewed_by_username,
        base.version_number as base_version_number,
        base.file_name as base_file_name,
        base.content_hash as base_content_hash,
        base.upload_date as base_upload_date
       FROM document_proposals dp
       JOIN users creator ON dp.proposed_by = creator.id
       LEFT JOIN users reviewer ON dp.reviewed_by = reviewer.id
       JOIN document_versions base ON dp.base_version_id = base.id
       WHERE dp.document_id = ?
       ORDER BY CASE dp.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, dp.created_at DESC`,
      [documentId]
    );
  }

  async createProposal(
    documentId: string,
    filePath: string,
    originalName: string,
    mimeType: string,
    fileSize: number,
    changeDescription: string,
    userId: string,
    userPassword: string,
    baseVersionId?: string
  ): Promise<{
    proposalId: string;
    documentId: string;
    baseVersionId: string;
    contentHash: string;
    signature: {
      algorithm: string;
      signedAt: Date;
    };
  }> {
    const document = this.getDocumentRecord(documentId);
    if (!document) {
      throw new Error('Documento no encontrado');
    }
    if (!document.is_public) {
      throw new Error('El documento no esta compartido para recibir propuestas');
    }
    if (document.owner_id === userId) {
      throw new Error('El propietario puede actualizar este documento directamente');
    }
    if (!changeDescription || !changeDescription.trim()) {
      throw new Error('Debes describir los cambios propuestos');
    }

    const baseVersion = baseVersionId
      ? this.getVersionRecord(documentId, baseVersionId)
      : this.getLatestVersionRecord(documentId);

    if (!baseVersion) {
      throw new Error('No se encontro la version base para la propuesta');
    }

    const signatureSource = this.signFileForUser(filePath, userId, userPassword);
    const proposalId = uuidv4();
    const proposalDir = ensureDirectory('proposals');
    const permanentPath = path.join(proposalDir, `${proposalId}-${originalName}`);
    moveUploadedFile(filePath, permanentPath);

    run(
      `INSERT INTO document_proposals
       (id, document_id, base_version_id, file_name, file_path, file_size, mime_type, content_hash, proposed_by, signature_value, signature_algorithm, signed_at, change_description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        proposalId,
        documentId,
        baseVersion.id,
        originalName,
        permanentPath,
        fileSize,
        mimeType,
        signatureSource.contentHash,
        userId,
        signatureSource.signature,
        signatureSource.algorithm,
        signatureSource.signedAt.toISOString(),
        changeDescription.trim(),
        'pending'
      ]
    );

    auditService.append('DOCUMENT_PROPOSAL_CREATED', 'document', documentId, userId, {
      proposalId,
      baseVersionId: baseVersion.id,
      hash: signatureSource.contentHash
    });

    saveDatabase();
    return {
      proposalId,
      documentId,
      baseVersionId: baseVersion.id,
      contentHash: signatureSource.contentHash,
      signature: {
        algorithm: signatureSource.algorithm,
        signedAt: signatureSource.signedAt
      }
    };
  }

  async acceptProposal(
    documentId: string,
    proposalId: string,
    userId: string,
    userPassword: string
  ): Promise<UploadResult & { proposalId: string; coauthorUsername: string | null }> {
    const document = this.getDocumentRecord(documentId);
    if (!document) {
      throw new Error('Documento no encontrado');
    }
    if (document.owner_id !== userId) {
      throw new Error('No tienes permisos para aceptar propuestas de este documento');
    }

    const proposal = this.getProposalRecord(documentId, proposalId);
    if (!proposal) {
      throw new Error('Propuesta no encontrada');
    }
    if (proposal.status !== 'pending') {
      throw new Error('La propuesta ya fue procesada');
    }

    const signatureSource = this.signFileForUser(proposal.file_path, userId, userPassword);
    const officialFileName = proposal.file_name;
    const versionId = uuidv4();
    const uploadDir = ensureDirectory();
    const permanentPath = path.join(uploadDir, `${versionId}-${officialFileName}`);
    fs.copyFileSync(proposal.file_path, permanentPath);

    const lastVersion = queryOne(
      'SELECT MAX(version_number) as max_version FROM document_versions WHERE document_id = ?',
      [documentId]
    ) as { max_version: number } | null;
    const versionNumber = ((lastVersion?.max_version || 0) as number) + 1;

    run(
      `INSERT INTO document_versions
       (id, document_id, version_number, file_name, file_path, file_size, mime_type, content_hash, uploaded_by, coauthor_id, source_proposal_id, change_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        versionId,
        documentId,
        versionNumber,
        officialFileName,
        permanentPath,
        proposal.file_size,
        proposal.mime_type,
        signatureSource.contentHash,
        userId,
        proposal.proposed_by,
        proposal.id,
        proposal.change_description
      ]
    );

    const sigId = uuidv4();
    run(
      'INSERT INTO document_signatures (id, version_id, signer_id, signature_value, signature_algorithm, signed_at) VALUES (?, ?, ?, ?, ?, ?)',
      [sigId, versionId, userId, signatureSource.signature, signatureSource.algorithm, signatureSource.signedAt.toISOString()]
    );

    run(
      `UPDATE document_proposals
       SET status = 'accepted', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, accepted_version_id = ?
       WHERE id = ?`,
      [userId, versionId, proposalId]
    );

    run('UPDATE documents SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [documentId]);

    auditService.append('DOCUMENT_PROPOSAL_ACCEPTED', 'document', documentId, userId, {
      proposalId,
      version: versionNumber,
      coauthorId: proposal.proposed_by
    });

    saveDatabase();
    return {
      documentId,
      versionId,
      versionNumber,
      contentHash: signatureSource.contentHash,
      proposalId,
      coauthorUsername: proposal.proposed_by_username,
      signature: {
        algorithm: signatureSource.algorithm,
        signedAt: signatureSource.signedAt
      }
    };
  }

  async rejectProposal(documentId: string, proposalId: string, userId: string): Promise<{ proposalId: string }> {
    const document = this.getDocumentRecord(documentId);
    if (!document) {
      throw new Error('Documento no encontrado');
    }
    if (document.owner_id !== userId) {
      throw new Error('No tienes permisos para rechazar propuestas de este documento');
    }

    const proposal = this.getProposalRecord(documentId, proposalId);
    if (!proposal) {
      throw new Error('Propuesta no encontrada');
    }
    if (proposal.status !== 'pending') {
      throw new Error('La propuesta ya fue procesada');
    }

    run(
      `UPDATE document_proposals
       SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [userId, proposalId]
    );

    auditService.append('DOCUMENT_PROPOSAL_REJECTED', 'document', documentId, userId, {
      proposalId,
      proposedBy: proposal.proposed_by
    });

    saveDatabase();
    return { proposalId };
  }

  resolveVersionFile(
    documentId: string,
    versionId: string | undefined,
    userId?: string
  ): { filePath: string; fileName: string; mimeType: string; fileSize: number } {
    const document = this.getDocumentRecord(documentId);
    if (!document) {
      throw new Error('Documento no encontrado');
    }
    if (!document.is_public && !isOwnerOrMissing(userId, document.owner_id)) {
      throw new Error('No tienes permisos para descargar este documento');
    }

    const base = versionId
      ? queryOne(
          'SELECT * FROM document_versions WHERE id = ? AND document_id = ?',
          [versionId, documentId]
        ) as { file_path: string; file_name: string; mime_type: string; file_size: number } | null
      : this.getLatestVersionRecord(documentId);

    if (!base || !base.file_path) {
      throw new Error('Version no encontrada');
    }

    return {
      filePath: base.file_path,
      fileName: base.file_name,
      mimeType: base.mime_type,
      fileSize: base.file_size
    };
  }

  resolveProposalFile(
    documentId: string,
    proposalId: string,
    userId?: string
  ): { filePath: string; fileName: string; mimeType: string; fileSize: number } {
    const proposal = this.getProposalRecord(documentId, proposalId);
    if (!proposal) {
      throw new Error('Propuesta no encontrada');
    }
    const isProponent = Boolean(userId && userId === proposal.proposed_by);
    if (!isProponent && !this.canAccessDocumentFile(documentId, userId)) {
      throw new Error('No tienes permisos para descargar esta propuesta');
    }

    return {
      filePath: proposal.file_path,
      fileName: proposal.file_name,
      mimeType: proposal.mime_type,
      fileSize: proposal.file_size
    };
  }

  private canAccessDocumentFile(documentId: string, userId?: string): boolean {
    const document = this.getDocumentRecord(documentId);
    if (!document) return false;
    return document.is_public ? true : isOwnerOrMissing(userId, document.owner_id);
  }

  getPublicProfile(username: string): any | null {
    const user = queryOne(
      'SELECT id, username, full_name, role, created_at FROM users WHERE username = ? AND is_active = 1',
      [username]
    ) as { id: string; username: string; full_name: string; role: string; created_at: string } | null;

    if (!user) {
      return null;
    }

    const documents = queryAll(
      `SELECT d.id, d.title, d.description, d.is_public, d.created_at, d.updated_at,
        (SELECT MAX(version_number) FROM document_versions WHERE document_id = d.id) as current_version,
        dv.id as latest_version_id,
        dv.version_number as latest_version_number,
        dv.file_name as latest_file_name,
        dv.file_size as latest_file_size,
        dv.mime_type as latest_mime_type,
        dv.content_hash as latest_content_hash,
        dv.upload_date as latest_upload_date,
        dv.change_description as latest_change_description,
        signer.username as signer_username,
        coauthor.username as coauthor_username
       FROM documents d
       LEFT JOIN document_versions dv ON dv.document_id = d.id
         AND dv.version_number = (
           SELECT MAX(version_number) FROM document_versions WHERE document_id = d.id
         )
       LEFT JOIN document_signatures ds ON ds.version_id = dv.id
       LEFT JOIN users signer ON ds.signer_id = signer.id
       LEFT JOIN users coauthor ON dv.coauthor_id = coauthor.id
       WHERE d.owner_id = ? AND d.is_public = 1
       ORDER BY d.updated_at DESC`,
      [user.id]
    );

    return {
      user,
      documents
    };
  }

  getArtifactForComparison(documentId: string, sourceType: ComparisonSourceType, sourceId: string): ComparableArtifact | null {
    if (sourceType === 'version') {
      const version = this.getVersionRecord(documentId, sourceId);
      if (!version) return null;
      return toComparableArtifact({
        label: `Version v${version.version_number}`,
        file_name: version.file_name,
        file_path: version.file_path,
        mime_type: version.mime_type,
        file_size: version.file_size,
        content_hash: version.content_hash,
        source_label: version.coauthor_username ? `${version.signer_username} + ${version.coauthor_username}` : version.signer_username,
        version_number: version.version_number
      });
    }

    const proposal = this.getProposalRecord(documentId, sourceId);
    if (!proposal) return null;
    return toComparableArtifact({
      label: `Proposal ${proposal.id.slice(0, 8)}`,
      file_name: proposal.file_name,
      file_path: proposal.file_path,
      mime_type: proposal.mime_type,
      file_size: proposal.file_size,
      content_hash: proposal.content_hash,
      source_label: proposal.proposed_by_username,
      version_number: proposal.base_version_number
    });
  }

  compareDocumentArtifacts(
    documentId: string,
    sourceType: ComparisonSourceType,
    sourceId: string,
    targetType: ComparisonSourceType,
    targetId: string,
    userId?: string
  ): ComparisonResult {
    const document = this.getDocumentRecord(documentId);
    if (!document) {
      throw new Error('Documento no encontrado');
    }
    if (!document.is_public && !isOwnerOrMissing(userId, document.owner_id)) {
      throw new Error('No tienes permisos para comparar este documento');
    }

    const source = this.getArtifactForComparison(documentId, sourceType, sourceId);
    const target = this.getArtifactForComparison(documentId, targetType, targetId);

    if (!source || !target) {
      throw new Error('No se pudo encontrar uno de los archivos a comparar');
    }

    return compareComparableArtifacts(source, target);
  }
}

export const documentService = new DocumentService();
