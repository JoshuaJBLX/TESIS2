import { describe, beforeEach, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getStoredUser: vi.fn(),
    isAuthenticated: vi.fn()
  }
}));

vi.mock('$lib/api', () => ({ api: mocks.api }));

async function loadStore(): Promise<any> {
  vi.resetModules();
  const { auth } = await import('./auth');
  return auth;
}

function collectValues(store: any): any[] {
  const values: any[] = [];
  store.subscribe((v: any) => values.push(v));
  return values;
}

const initial = { user: null, isAuthenticated: false, loading: true };

describe('auth store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('init restaura la sesión guardada', async () => {
    mocks.api.getStoredUser.mockReturnValue({ id: 'u1', username: 'alice', role: 'user' });
    mocks.api.isAuthenticated.mockReturnValue(true);
    const store = await loadStore();
    const values = collectValues(store);

    store.init();

    expect(values[values.length - 1]).toEqual({
      user: { id: 'u1', username: 'alice', role: 'user' },
      isAuthenticated: true,
      loading: false
    });
    expect(mocks.api.getStoredUser).toHaveBeenCalled();
    expect(mocks.api.isAuthenticated).toHaveBeenCalled();
  });

  it('login exitoso autentica al usuario', async () => {
    mocks.api.login.mockResolvedValue({
      success: true,
      data: { accessToken: 't', refreshToken: 'r', user: { id: 'u1', username: 'alice', role: 'admin' } }
    });
    const store = await loadStore();
    const values = collectValues(store);

    const res = await store.login('alice', 'abc');

    expect(res).toEqual({ success: true });
    expect(mocks.api.login).toHaveBeenCalledWith('alice', 'abc');
    expect(values[values.length - 1]).toEqual({
      user: { id: 'u1', username: 'alice', role: 'admin' },
      isAuthenticated: true,
      loading: false
    });
  });

  it('login fallido conserva el estado sin autenticar y propaga el error', async () => {
    mocks.api.login.mockResolvedValue({ success: false, error: 'Credenciales inválidas' });
    const store = await loadStore();
    const values = collectValues(store);

    const res = await store.login('alice', 'incorrecta');

    expect(res).toEqual({ success: false, error: 'Credenciales inválidas' });
    expect(values[values.length - 1].isAuthenticated).toBe(false);
    expect(values[values.length - 1].user).toBeNull();
  });

  it('register exitoso delega en el api', async () => {
    mocks.api.register.mockResolvedValue({ success: true, data: { userId: 'u2' } });
    const store = await loadStore();

    const res = await store.register('bob', 'bob@x.pe', 'Passwordbob123!', 'Bob');

    expect(res).toEqual({ success: true });
    expect(mocks.api.register).toHaveBeenCalledWith('bob', 'bob@x.pe', 'Passwordbob123!', 'Bob');
  });

  it('register fallido propaga el error', async () => {
    mocks.api.register.mockResolvedValue({ success: false, error: 'Contraseña débil' });
    const store = await loadStore();

    const res = await store.register('bob', 'b@x.pe', 'corta', 'Bob');

    expect(res).toEqual({ success: false, error: 'Contraseña débil' });
  });

  it('logout limpia el estado y llama a api.logout', async () => {
    const store = await loadStore();
    const values = collectValues(store);

    store.logout();

    expect(mocks.api.logout).toHaveBeenCalled();
    expect(values[values.length - 1]).toEqual({ user: null, isAuthenticated: false, loading: false });
  });

  it('emite el valor inicial de carga', async () => {
    const store = await loadStore();
    const values = collectValues(store);
    expect(values[0]).toEqual(initial);
  });
});