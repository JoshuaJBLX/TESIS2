import { describe, it, expect, beforeEach } from 'vitest';
import '../helpers/db.js';
import { freshBackend, validPassword } from '../helpers/bootstrap.js';

const PBKDF = 100000;

describe('AuthService', () => {
  let backend: Awaited<ReturnType<typeof freshBackend>>;

  beforeEach(async () => {
    backend = await freshBackend();
  });

  it('registra un usuario y crea su par de claves RSA', async () => {
    const { authService, query } = backend;
    const password = validPassword('reg1');
    const result = await authService.register({
      username: 'jose',
      email: 'jose@test.pe',
      password,
      fullName: 'José Pérez'
    });

    expect(result.userId).toBeTruthy();
    expect(result.username).toBe('jose');
    expect(result.role).toBe('user');
    expect(result.publicKeyFingerprint).toMatch(/^([0-9a-f]{2}:){31}[0-9a-f]{2}$/);

    const user = query.queryOne('SELECT * FROM users WHERE username = ?', ['jose']) as any;
    expect(user).toBeTruthy();
    expect(user.is_active).toBe(1);

    const keys = query.queryOne('SELECT * FROM user_keys WHERE user_id = ?', [result.userId]) as any;
    expect(keys.public_key).toContain('BEGIN PUBLIC KEY');
    expect(keys.encrypted_private_key).toContain('"encryptedData"');
    expect(keys.key_algorithm).toBe('RSA-2048');
  });

  it('rechaza contraseñas que no cumplen la política de seguridad', async () => {
    const { authService } = backend;
    await expect(
      authService.register({ username: 'flojo', email: 'flojo@test.pe', password: 'abc123', fullName: 'Flojo' })
    ).rejects.toThrow('al menos 12 caracteres');
  });

  it('rechaza usuarios duplicados por username o email', async () => {
    const { authService } = backend;
    const password = validPassword('dup1');
    await authService.register({ username: 'duplicado', email: 'dup@test.pe', password, fullName: 'Uno' });

    await expect(
      authService.register({ username: 'duplicado', email: 'otro@test.pe', password: validPassword('dup2'), fullName: 'Dos' })
    ).rejects.toThrow('ya está registrado');

    await expect(
      authService.register({ username: 'otrousuario', email: 'dup@test.pe', password: validPassword('dup3'), fullName: 'Tres' })
    ).rejects.toThrow('ya está registrado');
  });

  it('inicia sesión y devuelve tokens de acceso y refresco', async () => {
    const { authService } = backend;
    const password = validPassword('login1');
    await authService.register({ username: 'lucia', email: 'lucia@test.pe', password, fullName: 'Lucía' });

    const tokens = await authService.login({ username: 'lucia', password });
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(tokens.user.username).toBe('lucia');
    expect(tokens.user.role).toBe('user');
  });

  it('rechaza credenciales incorrectas', async () => {
    const { authService } = backend;
    const password = validPassword('log2');
    await authService.register({ username: 'ana', email: 'ana@test.pe', password, fullName: 'Ana' });

    await expect(authService.login({ username: 'ana', password: 'Mala123444!' })).rejects.toThrow('Credenciales inválidas');
    await expect(authService.login({ username: 'inexistente', password })).rejects.toThrow('Credenciales inválidas');
  });

  it('refresca el access token con un refresh token válido', async () => {
    const { authService } = backend;
    const password = validPassword('ref1');
    await authService.register({ username: 'pedro', email: 'pedro@test.pe', password, fullName: 'Pedro' });
    const { refreshToken } = await authService.login({ username: 'pedro', password });

    const { accessToken } = await authService.refresh(refreshToken);
    expect(accessToken).toBeTruthy();
    expect(accessToken).not.toBeUndefined();
  });

  it('rechaza refresh tokens inválidos', async () => {
    const { authService } = backend;
    await expect(authService.refresh('refresh-invalido')).rejects.toThrow('Refresh token inválido');
  });
});

void PBKDF;