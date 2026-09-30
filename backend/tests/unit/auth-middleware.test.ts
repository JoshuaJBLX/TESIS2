import { describe, it, expect, vi, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-jwt-secret';
process.env.JWT_SECRET = TEST_SECRET;

// Import dinámico para que los módulos lean el secret recién configurado.
let authenticate: any;
let authenticateOptional: any;
let requireAdmin: any;

beforeAll(async () => {
  const mod = await import('../../src/middleware/auth.js');
  authenticate = mod.authenticate;
  authenticateOptional = mod.authenticateOptional;
  requireAdmin = mod.requireAdmin;
});

function signedToken(user: { id: string; username: string; role: string }): string {
  return jwt.sign({ user }, TEST_SECRET, { expiresIn: '1h' });
}

function fakeRes() {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  return res;
}

describe('authenticate', () => {
  it('rechaza peticiones sin cabecera Authorization', () => {
    const req: any = { headers: {} };
    const res = fakeRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token de autenticación requerido' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza cabeceras que no usan Bearer', () => {
    const req: any = { headers: { authorization: 'Basic abc123' } };
    const res = fakeRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza tokens inválidos o expirados', () => {
    const req: any = { headers: { authorization: 'Bearer token-invalido' } };
    const res = fakeRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token inválido o expirado' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('autentica usuarios con un token válido', () => {
    const user = { id: 'u1', username: 'admin', role: 'admin' as const };
    const req: any = { headers: { authorization: `Bearer ${signedToken(user)}` } };
    const res = fakeRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('authenticateOptional', () => {
  it('continuara si no hay token', () => {
    const req: any = { headers: {} };
    const next = vi.fn();
    authenticateOptional(req, fakeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });

  it('ignora tokens inválidos y continúa', () => {
    const req: any = { headers: { authorization: 'Bearer invalido' } };
    const next = vi.fn();
    authenticateOptional(req, fakeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });

  it('asigna el usuario cuando el token es válido', () => {
    const user = { id: 'u1', username: 'maria', role: 'user' as const };
    const req: any = { headers: { authorization: `Bearer ${signedToken(user)}` } };
    const next = vi.fn();
    authenticateOptional(req, fakeRes(), next);
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('requireAdmin', () => {
  it('bloquea usuarios sin rol admin con 403', () => {
    const next = vi.fn();
    const res = fakeRes();
    requireAdmin({ user: { id: 'u1', username: 'maria', role: 'user' } } as any, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Se requieren permisos de administrador' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('permite a administradores continuar', () => {
    const next = vi.fn();
    requireAdmin({ user: { id: 'u1', username: 'admin', role: 'admin' } } as any, fakeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});