import { describe, it, expect, afterEach, vi } from 'vitest';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function stubWindowLocalStorage(): Map<string, string> {
  const storage = new Map<string, string>();
  const localStorageMock = {
    getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
    clear: () => void storage.clear(),
    key: (i: number) => Array.from(storage.keys())[i] ?? null,
    get length() { return storage.size; }
  };
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', localStorageMock);
  return storage;
}

async function freshApi(fetchMock: unknown): Promise<any> {
  vi.resetModules();
  vi.stubGlobal('fetch', fetchMock);
  const mod = await import('./api');
  return mod.api;
}

describe('ApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('login exitoso guarda tokens, usuario y marca sesión', async () => {
    const storage = stubWindowLocalStorage();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      success: true,
      data: {
        accessToken: 'tok-1',
        refreshToken: 'reftok-1',
        user: { id: 'u1', username: 'alice', role: 'user' }
      }
    }));
    const api = await freshApi(fetchMock);

    const res = await api.login('alice', 'abc');

    expect(res.success).toBe(true);
    expect(api.isAuthenticated()).toBe(true);
    expect(storage.get('accessToken')).toBe('tok-1');
    expect(storage.get('refreshToken')).toBe('reftok-1');
    expect(api.getStoredUser()).toEqual({ id: 'u1', username: 'alice', role: 'user' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/auth/login');
    expect(JSON.parse(init.body)).toEqual({ username: 'alice', password: 'abc' });
  });

  it('login fallido propaga el error y no marca sesión', async () => {
    stubWindowLocalStorage();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: false, error: 'Usuario no existe' }, 400));
    const api = await freshApi(fetchMock);

    const res = await api.login('alice', 'abc');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Usuario no existe');
    expect(api.isAuthenticated()).toBe(false);
  });

  it('register envía los datos y devuelve el userId', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      success: true,
      data: { userId: 'u2', username: 'bob', role: 'user', publicKeyFingerprint: 'A1F2' }
    }));
    const api = await freshApi(fetchMock);

    const res = await api.register('bob', 'bob@x.pe', 'Passwordbob123!', 'Bob');

    expect(res.success).toBe(true);
    expect(res.data.userId).toBe('u2');

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/auth/register');
    expect(JSON.parse(init.body)).toEqual({ username: 'bob', email: 'bob@x.pe', password: 'Passwordbob123!', fullName: 'Bob' });
  });

  it('añade el token Authorization a las peticiones autenticadas', async () => {
    const storage = stubWindowLocalStorage();
    storage.set('accessToken', 'tok-1');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: [{ id: 'd1' }] }));
    const api = await freshApi(fetchMock);

    await api.getDocuments();

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-1');
  });

  it('refresca el token ante un 401 y reintenta con el token nuevo', async () => {
    const storage = stubWindowLocalStorage();
    storage.set('accessToken', 'tok-viejo');
    storage.set('refreshToken', 'reftok-1');

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'token expirado' }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { accessToken: 'tok-nuevo' } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [{ id: 'd1' }] }));
    const api = await freshApi(fetchMock);

    const res = await api.getDocuments();

    expect(res.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const refreshCall = fetchMock.mock.calls[1];
    expect(String(refreshCall[0])).toContain('/api/auth/refresh');
    expect(JSON.parse(refreshCall[1].body)).toEqual({ refreshToken: 'reftok-1' });

    const retry = fetchMock.mock.calls[2];
    expect((retry[1].headers as Record<string, string>).Authorization).toBe('Bearer tok-nuevo');
    expect(storage.get('accessToken')).toBe('tok-nuevo');
  });

  it('no reintenta si el refresh falla', async () => {
    const storage = stubWindowLocalStorage();
    storage.set('accessToken', 'tok-viejo');
    storage.set('refreshToken', 'reftok-1');

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'expirado' }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: false, error: 'refresh inválido' }, 401));
    const api = await freshApi(fetchMock);

    const res = await api.getDocuments();

    expect(res.success).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('logout limpia tokens y estado', async () => {
    const storage = stubWindowLocalStorage();
    storage.set('accessToken', 't');
    storage.set('refreshToken', 'r');
    storage.set('user', '{}');
    const fetchMock = vi.fn();
    const api = await freshApi(fetchMock);

    api.logout();

    expect(api.isAuthenticated()).toBe(false);
    expect(storage.has('accessToken')).toBe(false);
    expect(storage.has('refreshToken')).toBe(false);
    expect(storage.has('user')).toBe(false);
  });

  it('devuelve error de conexión si fetch lanza', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    const api = await freshApi(fetchMock);

    const res = await api.getDocuments();

    expect(res.success).toBe(false);
    expect(res.error).toContain('conexión');
  });

  it('getAudit agrupa el data y la paginación', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      success: true,
      data: [{ id: 1, event_type: 'LOGIN_SUCCESS', entity_type: 'user', entity_id: 'u1', user_id: 'u1', event_data: '{}', previous_hash: null, current_hash: 'h', created_at: '2026-01-01' }],
      pagination: { limit: 10, offset: 0, total: 1 }
    }));
    const api = await freshApi(fetchMock);

    const res = await api.getAudit(10, 0);

    expect(res.success).toBe(true);
    expect(res.data.items).toHaveLength(1);
    expect(res.data.pagination.total).toBe(1);
  });

  it('genera las URLs de descarga con los parámetros correctos', async () => {
    const api = await freshApi(vi.fn());
    expect(api.downloadDocumentUrl('doc-1')).toContain('/api/docs/doc-1/file');
    expect(api.downloadDocumentUrl('doc-1', 'v-2')).toContain('?versionId=v-2');
    expect(api.downloadProposalUrl('doc-1', 'prop-3')).toContain('/api/docs/doc-1/proposals/prop-3/file');
  });
});

describe('resolveApiBase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('usa el backend del puerto 3000 por defecto en desarrollo local', async () => {
    const mod = await import('./api');
    expect(mod.resolveApiBase()).toBe('http://localhost:3000/api');
  });

  it('no usa el origen del cliente en desarrollo (puerto 5173)', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173', port: '5173' } });
    const mod = await import('./api');
    expect(mod.resolveApiBase()).toBe('http://localhost:3000/api');
  });

  it('respeta VITE_API_URL y normaliza la barra final', async () => {
    vi.stubEnv('VITE_API_URL', 'https://sgd-fd.vercel.app/api///');
    const mod = await import('./api');
    expect(mod.resolveApiBase()).toBe('https://sgd-fd.vercel.app/api');
  });

  it('añade /api a PUBLIC_API_ORIGIN cuando no se define VITE_API_URL', async () => {
    vi.stubEnv('PUBLIC_API_ORIGIN', 'https://api.sgd-fd.pe/');
    const mod = await import('./api');
    expect(mod.resolveApiBase()).toBe('https://api.sgd-fd.pe/api');
  });

  it('da prioridad a VITE_API_URL sobre PUBLIC_API_ORIGIN', async () => {
    vi.stubEnv('VITE_API_URL', 'https://a.example/api');
    vi.stubEnv('PUBLIC_API_ORIGIN', 'https://b.example');
    const mod = await import('./api');
    expect(mod.resolveApiBase()).toBe('https://a.example/api');
  });
});