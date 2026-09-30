import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { queryOne, run } from '../db/query.js';
import { saveDatabase } from '../db/connection.js';
import { generateKeyPair } from '../crypto/keyGenerator.js';
import { encryptPrivateKey, packEncryptedKey } from '../crypto/keyProtection.js';
import type { User, RegisterDTO, LoginDTO, AuthTokens } from '../models/types.js';
import { auditService } from './audit.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {

  async register(data: RegisterDTO): Promise<{ userId: string; username: string; role: string; publicKeyFingerprint: string }> {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(data.password)) {
      throw new Error('La contraseña debe tener al menos 12 caracteres, incluir mayúscula, minúscula, número y carácter especial');
    }

    const existing = queryOne('SELECT id FROM users WHERE username = ? OR email = ?', [data.username, data.email]);
    if (existing) {
      throw new Error('El nombre de usuario o email ya está registrado');
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(data.password, 12);

    // Generate cryptographic key pair
    const keyPair = generateKeyPair('RSA-2048');

    // Encrypt private key with user's password
    const encryptedPrivateKey = encryptPrivateKey(keyPair.privateKey, data.password);

    // Store user
    run(
      'INSERT INTO users (id, username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.username, data.email, passwordHash, 'user', data.fullName]
    );

    // Store keys
    const keyId = uuidv4();
    run(
      'INSERT INTO user_keys (id, user_id, public_key, encrypted_private_key, key_algorithm, key_fingerprint) VALUES (?, ?, ?, ?, ?, ?)',
      [keyId, id, keyPair.publicKey, packEncryptedKey(encryptedPrivateKey), keyPair.algorithm, keyPair.fingerprint]
    );

    saveDatabase();
    auditService.append('USER_REGISTERED', 'user', id, id, { username: data.username, role: 'user' });

    return {
      userId: id,
      username: data.username,
      role: 'user',
      publicKeyFingerprint: keyPair.fingerprint
    };
  }

  async login(data: LoginDTO): Promise<AuthTokens> {
    const user = queryOne('SELECT * FROM users WHERE username = ? AND is_active = 1', [data.username]) as User | null;

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const passwordValid = bcrypt.compareSync(data.password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Credenciales inválidas');
    }

    const accessToken = jwt.sign(
      { user: { id: user.id, username: user.username, role: user.role } },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    const refreshToken = jwt.sign(
      { user: { id: user.id, username: user.username, role: user.role } },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    auditService.append('LOGIN_SUCCESS', 'auth', user.id, user.id, { username: user.username });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

      const user = queryOne('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.user.id]) as User | null;

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const accessToken = jwt.sign(
        { user: { id: user.id, username: user.username, role: user.role } },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  }
}

export const authService = new AuthService();
