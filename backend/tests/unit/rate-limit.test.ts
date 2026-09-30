import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter, bruteForceProtection } from '../../src/middleware/rateLimit.js';

function fakeRes() {
  const headers: Record<string, string> = {};
  const res: any = {
    setHeader: (k: string, v: string | number) => { headers[k] = String(v); },
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    __headers: headers
  };
  return res;
}

function fakeReq(ip = '127.0.0.1') {
  return { ip, socket: { remoteAddress: ip } };
}

describe('createRateLimiter', () => {
  it('permite solicitudes dentro del límite y llama a next', () => {
    const limiter = createRateLimiter(60000, 2);
    const next = vi.fn();
    const res = fakeRes();

    limiter(fakeReq() as any, res, next);
    limiter(fakeReq() as any, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('rechaza con 429 una vez superado el límite', () => {
    const limiter = createRateLimiter(60000, 1);
    const res = fakeRes();
    const next = vi.fn();

    limiter(fakeReq() as any, res, next);
    limiter(fakeReq() as any, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('expone cabeceras de límite', () => {
    const limiter = createRateLimiter(60000, 3);
    const res = fakeRes();
    const next = vi.fn();
    limiter(fakeReq() as any, res, next);

    expect(res.__headers['RateLimit-Limit']).toBe('3');
    expect(res.__headers['RateLimit-Remaining']).toBe('2');
    expect(res.__headers['RateLimit-Reset']).toBeTruthy();
  });

  it('reinicia el contador al vencer la ventana', () => {
    vi.useFakeTimers();
    try {
      const limiter = createRateLimiter(1000, 1);
      const next = vi.fn();
      const res = fakeRes();

      limiter(fakeReq() as any, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Supera el límite en la misma ventana
      limiter(fakeReq() as any, res, next);
      expect(res.status).toHaveBeenCalledWith(429);

      // Nueva ventana: se permite de nuevo
      vi.advanceTimersByTime(1001);
      const next2 = vi.fn();
      const res2 = fakeRes();
      limiter(fakeReq() as any, res2, next2);
      expect(next2).toHaveBeenCalledTimes(1);
      expect(res2.json).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('bruteForceProtection', () => {
  it('cuenta intentos fallidos y bloquea tras el máximo', () => {
    const bf = bruteForceProtection(60000, 3);
    const key = '1.2.3.4:admin';

    expect(bf.check(key)).toBe(0);
    bf.failed(key);
    bf.failed(key);
    bf.failed(key);
    expect(bf.check(key)).toBe(3);

    // Con la ventana activa, la clave queda bloqueada
    expect(bf.check(key)).toBeGreaterThanOrEqual(bf.maxAttempts);
  });

  it('succeeded() limpia el acumulador', () => {
    const bf = bruteForceProtection(60000, 5);
    const key = '1.2.3.4:user';
    bf.failed(key);
    bf.failed(key);
    bf.succeeded(key);
    expect(bf.check(key)).toBe(0);
  });

  it('expira el bloqueo al pasar la ventana', () => {
    vi.useFakeTimers();
    try {
      const bf = bruteForceProtection(60000, 5);
      const key = '1.2.3.4:admin';
      bf.failed(key);
      bf.failed(key);
      expect(bf.check(key)).toBe(2);

      vi.advanceTimersByTime(60001);
      expect(bf.check(key)).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});