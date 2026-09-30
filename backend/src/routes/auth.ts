import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createRateLimiter, bruteForceProtection } from '../middleware/rateLimit.js';
import { auditService } from '../services/audit.service.js';

const router: Router = Router();
const loginLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Demasiados intentos de inicio de sesión. Intenta en unos minutos.');
const registerLimiter = createRateLimiter(60 * 60 * 1000, 10, 'Demasiados registros desde esta dirección. Intenta más tarde.');
const bruteForce = bruteForceProtection();

// POST /api/auth/register
router.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    if (!username || !email || !password || !fullName) {
      res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos: username, email, password, fullName'
      });
      return;
    }
    
    const result = await authService.register({ username, email, password, fullName });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${username}`;
  const attempts = bruteForce.check(key);
  if (attempts >= bruteForce.maxAttempts) {
    res.status(429).json({ success: false, error: 'Cuenta temporalmente bloqueada por demasiados intentos fallidos.', retryAfterSeconds: 900 });
    return;
  }
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username y password son requeridos'
      });
      return;
    }
    
    const tokens = await authService.login({ username, password });
    bruteForce.succeeded(key);
    
    res.json({
      success: true,
      data: tokens
    });
  } catch (error: any) {
    bruteForce.failed(key);
    auditService.append('LOGIN_FAILED', 'auth', username || 'unknown', null, { username: username || '[REDACTED]', ip: req.ip || 'unknown', reason: 'invalid_credentials' });
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token es requerido'
      });
      return;
    }
    
    const result = await authService.refresh(refreshToken);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/auth/me (protected)
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    }
  });
});

export default router;
