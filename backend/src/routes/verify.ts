import { Router, Request, Response } from 'express';
import multer from 'multer';
import { queryOne } from '../db/query.js';
import { calculateFileHash } from '../crypto/signature.js';
import { verifyDocument } from '../crypto/verification.js';

const router: Router = Router();
const upload = multer({ dest: 'uploads/temp/' });

// POST /api/verify - Verify uploaded document
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No se proporcionó archivo para verificar' });
      return;
    }

    const { documentId, versionNumber } = req.body;

    if (documentId) {
      // Verify against specific document
      const document = queryOne('SELECT * FROM documents WHERE id = ?', [documentId]);
      if (!document) {
        res.status(404).json({
          success: true,
          data: {
            status: 'NOT_FOUND',
            message: 'Documento no encontrado en el repositorio'
          }
        });
        return;
      }

      // Get version (latest or specific)
      let versionQuery = 'SELECT * FROM document_versions WHERE document_id = ?';
      const params: any[] = [documentId];

      if (versionNumber) {
        versionQuery += ' AND version_number = ?';
        params.push(parseInt(versionNumber));
      } else {
        versionQuery += ' ORDER BY version_number DESC LIMIT 1';
      }

      const version = queryOne(versionQuery, params);
      if (!version) {
        res.status(404).json({
          success: true,
          data: {
            status: 'NOT_FOUND',
            message: 'Versión no encontrada'
          }
        });
        return;
      }

      // Get signature and public key
      const sigData = queryOne(
        `SELECT ds.*, uk.public_key, u.username as signer_username
         FROM document_signatures ds
         JOIN user_keys uk ON uk.user_id = ds.signer_id
         JOIN users u ON ds.signer_id = u.id
         WHERE ds.version_id = ?`,
        [version.id]
      );

      if (!sigData) {
        res.status(404).json({
          success: true,
          data: {
            status: 'NOT_FOUND',
            message: 'Firma no encontrada para esta versión'
          }
        });
        return;
      }

      // Verify
      const verification = verifyDocument(
        req.file.path,
        version.content_hash,
        sigData.public_key,
        sigData.signature_value
      );

      const status = verification.isValid ? 'VALID' :
        !verification.hashMatch ? 'MANIPULATED' : 'INVALID_SIGNATURE';

      const message = verification.isValid ? 'Documento íntegro y vigente' :
        !verification.hashMatch ? 'El documento ha sido manipulado (hash no coincide)' :
        'Firma digital inválida';

      res.json({
        success: true,
        data: {
          status,
          document: {
            id: document.id,
            title: document.title,
            currentVersion: version.version_number
          },
          verification: {
            hashMatch: verification.hashMatch,
            signatureValid: verification.signatureMatch,
            signedBy: sigData.signer_username,
            signedAt: sigData.signed_at
          },
          message
        }
      });
    } else {
      // Search by hash
      const currentHash = calculateFileHash(req.file.path);

      const matches = queryOne(
        `SELECT dv.*, d.title, d.id as document_id
         FROM document_versions dv
         JOIN documents d ON dv.document_id = d.id
         WHERE dv.content_hash = ?
         ORDER BY dv.upload_date DESC
         LIMIT 1`,
        [currentHash]
      );

      if (matches) {
        res.json({
          success: true,
          data: {
            status: 'FOUND',
            matches: [{
              documentId: matches.document_id,
              title: matches.title,
              version: matches.version_number,
              lastModified: matches.upload_date
            }],
            message: 'Se encontró coincidencia en el repositorio'
          }
        });
      } else {
        res.json({
          success: true,
          data: {
            status: 'NOT_FOUND',
            matches: [],
            message: 'No se encontró coincidencia en el repositorio'
          }
        });
      }
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/verify/:documentId - Get verification info (for QR scan)
router.get('/:documentId', (req: Request, res: Response) => {
  try {
    const document = queryOne('SELECT * FROM documents WHERE id = ?', [req.params.documentId]);

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Documento no encontrado'
      });
      return;
    }

    const latestVersion = queryOne(
      `SELECT dv.*, ds.signed_at, u.username as signer_username
       FROM document_versions dv
       JOIN document_signatures ds ON ds.version_id = dv.id
       JOIN users u ON ds.signer_id = u.id
       WHERE dv.document_id = ?
       ORDER BY dv.version_number DESC
       LIMIT 1`,
      [document.id]
    );

    res.json({
      success: true,
      data: {
        document: {
          id: document.id,
          title: document.title,
          currentVersion: latestVersion?.version_number || 0,
          lastModified: document.updated_at
        },
        signature: {
          valid: true,
          signedBy: latestVersion?.signer_username || 'Unknown',
          signedAt: latestVersion?.signed_at || null
        },
        instructions: 'Suba el documento para verificar su integridad'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
