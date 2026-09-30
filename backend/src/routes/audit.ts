import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { auditService } from '../services/audit.service.js';

const router: Router = Router();
router.use(authenticate, requireAdmin);

router.get('/', (req: AuthRequest, res: Response) => {
  const rawLimit = Number(req.query.limit || 50);
  const rawOffset = Number(req.query.offset || 0);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;
  const filters = {
    eventType: typeof req.query.eventType === 'string' ? req.query.eventType : undefined,
    entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined,
    from: typeof req.query.from === 'string' ? req.query.from : undefined,
    to: typeof req.query.to === 'string' ? req.query.to : undefined
  };
  res.json({ success: true, data: auditService.list(limit, offset, filters), pagination: { limit, offset, total: auditService.count(filters) }, filters });
});

router.get('/verify-chain', (_req: AuthRequest, res: Response) => {
  const result = auditService.verifyChain();
  res.status(result.valid ? 200 : 409).json({ success: result.valid, data: result });
});

export default router;
