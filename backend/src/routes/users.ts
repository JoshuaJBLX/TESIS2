import { Router, Request, Response } from 'express';
import { documentService } from '../services/document.service.js';

const router: Router = Router();

router.get('/:username', (req: Request, res: Response) => {
  try {
    const profile = documentService.getPublicProfile(String(req.params.username));
    if (!profile) {
      res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
