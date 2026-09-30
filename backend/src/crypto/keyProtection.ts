import crypto from 'crypto';

export interface EncryptedKey {
  encryptedData: string;
  iv: string;
  authTag: string;
  salt: string;
}

export function encryptPrivateKey(privateKeyPem: string, userPassword: string): EncryptedKey {
  const salt = crypto.randomBytes(16);

  const key = crypto.pbkdf2Sync(
    userPassword,
    salt,
    100000,
    32,
    'sha512'
  );

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(privateKeyPem, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  return {
    encryptedData: encrypted,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    salt: salt.toString('base64')
  };
}

export function decryptPrivateKey(encryptedKey: EncryptedKey, userPassword: string): string {
  const salt = Buffer.from(encryptedKey.salt, 'base64');
  const iv = Buffer.from(encryptedKey.iv, 'base64');
  const authTag = Buffer.from(encryptedKey.authTag, 'base64');

  const key = crypto.pbkdf2Sync(
    userPassword,
    salt,
    100000,
    32,
    'sha512'
  );

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedKey.encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function packEncryptedKey(encryptedKey: EncryptedKey): string {
  return JSON.stringify(encryptedKey);
}

export function unpackEncryptedKey(packed: string): EncryptedKey {
  return JSON.parse(packed);
}
