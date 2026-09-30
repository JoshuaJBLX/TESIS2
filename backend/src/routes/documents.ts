import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import QRCode from 'qrcode';
import { documentService } from '../services/document.service.js';
import { authenticate, authenticateOptional, AuthRequest } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router: Router = Router();
const ALLOWED_MIME = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']);
const UPLOAD_TEMP_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'temp');
if (!fs.existsSync(UPLOAD_TEMP_DIR)) fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_TEMP_DIR, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, ALLOWED_MIME.has(file.mimetype)) });

function cleanupTemp(file?: Express.Multer.File) {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

function fileErrorStatus(error: any): number {
  const msg = String(error?.message || '');
  if (msg.includes('No tienes permisos')) return 403;
  if (msg.includes('no encontrado') || msg.includes('no encontrada')) return 404;
  return 400;
}

function streamFile(res: Response, file: { filePath: string; fileName: string; mimeType: string; fileSize: number }) {
  const absolutePath = path.resolve(__dirname, '..', '..', file.filePath);
  if (!fs.existsSync(absolutePath)) {
    res.status(404).json({ success: false, error: 'Archivo no encontrado en el repositorio' });
    return;
  }
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', String(file.fileSize ?? fs.statSync(absolutePath).size));
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName || 'documento')}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  fs.createReadStream(absolutePath).pipe(res);
}

// GET /api/docs - List documents
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const documents = documentService.getDocuments(req.user!.id);
    res.json({ success: true, data: documents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/docs - Upload document
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
      return;
    }
    if (!ALLOWED_MIME.has(req.file.mimetype) || req.file.size === 0) { cleanupTemp(req.file); res.status(400).json({ success: false, error: 'Tipo de archivo no permitido o archivo vacío' }); return; }

    const { title, description, changeDescription, password } = req.body;

    if (!title || !password) {
      res.status(400).json({ success: false, error: 'Título y contraseña son requeridos' });
      return;
    }

    const result = await documentService.uploadDocument(
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      title,
      description || null,
      changeDescription || null,
      req.user!.id,
      password
    );

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/verify/${result.documentId}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 256,
      margin: 2
    });

    res.status(201).json({
      success: true,
      data: {
        ...result,
        verificationUrl,
        qrCode: qrDataUrl
      }
    });
  } catch (error: any) {
    cleanupTemp(req.file);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/docs/:id - Update document (new version)
router.put('/:id', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
      return;
    }
    if (!ALLOWED_MIME.has(req.file.mimetype) || req.file.size === 0) { cleanupTemp(req.file); res.status(400).json({ success: false, error: 'Tipo de archivo no permitido o archivo vacío' }); return; }

    const { changeDescription, password } = req.body;

    if (!password) {
      res.status(400).json({ success: false, error: 'Contraseña requerida para firmar' });
      return;
    }

    const result = await documentService.updateDocument(
      String(req.params.id),
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      changeDescription || null,
      req.user!.id,
      password
    );

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/verify/${result.documentId}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 256,
      margin: 2
    });

    res.json({
      success: true,
      data: {
        ...result,
        verificationUrl,
        qrCode: qrDataUrl
      }
    });
  } catch (error: any) {
    cleanupTemp(req.file);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/docs/:id - Get document details
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const document = documentService.getDocument(String(req.params.id), req.user!.id);
    if (!document) {
      res.status(404).json({ success: false, error: 'Documento no encontrado' });
      return;
    }
    res.json({ success: true, data: document });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/docs/:id/versions - Get document versions
router.get('/:id/versions', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const document = documentService.getDocument(String(req.params.id), req.user!.id);
    if (!document) { res.status(404).json({ success: false, error: 'Documento no encontrado' }); return; }
    const versions = documentService.getDocumentVersions(String(req.params.id), req.user!.id);
    res.json({ success: true, data: versions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/docs/:id/qr - Get QR code for document
router.get('/:id/qr', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const document = documentService.getDocument(String(req.params.id), req.user!.id);
    if (!document) {
      res.status(404).json({ success: false, error: 'Documento no encontrado' });
      return;
    }

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/verify/${String(req.params.id)}`;

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 256,
      margin: 2
    });

    res.json({
      success: true,
      data: {
        qrCode: qrDataUrl,
        verificationUrl,
        documentId: String(req.params.id)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/docs/:id/public - Public read-only view of a shared document
router.get('/:id/public', (req: Request, res: Response) => {
  try {
    const doc = documentService.getDocument(String(req.params.id));
    if (!doc || !doc.is_public) {
      res.status(404).json({ success: false, error: 'Documento no encontrado o no disponible públicamente' });
      return;
    }
    const versions = documentService.getDocumentVersions(String(req.params.id));
    res.json({ success: true, data: { document: doc, versions } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/docs/:id/visibility - Share/unshare document (owner only)
router.patch('/:id/visibility', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const isPublic = Boolean(req.body?.isPublic);
    const result = await documentService.setDocumentVisibility(String(req.params.id), req.user!.id, isPublic);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/docs/:id/file - Download a version file (latest by default)
router.get('/:id/file', authenticateOptional, (req: AuthRequest, res: Response) => {
  try {
    const versionId = typeof req.query.versionId === 'string' ? req.query.versionId : undefined;
    const file = documentService.resolveVersionFile(String(req.params.id), versionId, req.user?.id);
    streamFile(res, file);
  } catch (error: any) {
    res.status(fileErrorStatus(error)).json({ success: false, error: error.message });
  }
});

// GET /api/docs/:id/proposals - List proposals (owner)
router.get('/:id/proposals', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const proposals = documentService.getDocumentProposals(String(req.params.id), req.user!.id);
    res.json({ success: true, data: proposals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/docs/:id/proposals - Send a signed proposal (registered user, public doc)
router.post('/:id/proposals', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
      return;
    }
    if (!ALLOWED_MIME.has(req.file.mimetype) || req.file.size === 0) {
      cleanupTemp(req.file);
      res.status(400).json({ success: false, error: 'Tipo de archivo no permitido o archivo vacío' });
      return;
    }

    const { changeDescription, password, baseVersionId } = req.body;
    if (!changeDescription || !password) {
      cleanupTemp(req.file);
      res.status(400).json({ success: false, error: 'Descripción de cambios y contraseña son requeridos' });
      return;
    }

    const result = await documentService.createProposal(
      String(req.params.id),
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      changeDescription,
      req.user!.id,
      password,
      typeof baseVersionId === 'string' && baseVersionId ? baseVersionId : undefined
    );
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    cleanupTemp(req.file);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/docs/:id/proposals/:proposalId/file - Download proposal file
router.get('/:id/proposals/:proposalId/file', authenticateOptional, (req: AuthRequest, res: Response) => {
  try {
    const file = documentService.resolveProposalFile(String(req.params.id), String(req.params.proposalId), req.user?.id);
    streamFile(res, file);
  } catch (error: any) {
    res.status(fileErrorStatus(error)).json({ success: false, error: error.message });
  }
});

// POST /api/docs/:id/proposals/:proposalId/accept - Accept proposal (owner)
router.post('/:id/proposals/:proposalId/accept', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      res.status(400).json({ success: false, error: 'Contraseña requerida para firmar la nueva versión' });
      return;
    }
    const result = await documentService.acceptProposal(
      String(req.params.id),
      String(req.params.proposalId),
      req.user!.id,
      password
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/docs/:id/proposals/:proposalId/reject - Reject proposal (owner)
router.post('/:id/proposals/:proposalId/reject', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await documentService.rejectProposal(String(req.params.id), String(req.params.proposalId), req.user!.id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/docs/:id/compare - Compare two artifacts (version/proposal)
router.get('/:id/compare', authenticateOptional, (req: AuthRequest, res: Response) => {
  try {
    const { sourceType, sourceId, targetType, targetId } = req.query;
    if (typeof sourceType !== 'string' || typeof sourceId !== 'string' ||
        typeof targetType !== 'string' || typeof targetId !== 'string') {
      res.status(400).json({ success: false, error: 'Parámetros de comparación inválidos' });
      return;
    }
    const result = documentService.compareDocumentArtifacts(
      String(req.params.id),
      sourceType as 'version' | 'proposal',
      sourceId,
      targetType as 'version' | 'proposal',
      targetId,
      req.user?.id
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
