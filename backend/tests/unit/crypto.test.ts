import { describe, it, expect } from 'vitest';
import { generateKeyPair } from '../../src/crypto/keyGenerator.js';
import { encryptPrivateKey, decryptPrivateKey, packEncryptedKey, unpackEncryptedKey } from '../../src/crypto/keyProtection.js';
import { calculateFileHash, signDocument } from '../../src/crypto/signature.js';
import { verifyDocument } from '../../src/crypto/verification.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

function tempFile(content: string): string {
  const p = path.join(os.tmpdir(), `tesis-crypto-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

describe('keyGenerator', () => {
  it('genera un par RSA-2048 con fingerprint SHA-256 formateado', () => {
    const pair = generateKeyPair('RSA-2048');
    expect(pair.algorithm).toBe('RSA-2048');
    expect(pair.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(pair.privateKey).toContain('BEGIN PRIVATE KEY');
    expect(pair.fingerprint).toMatch(/^([0-9a-f]{2}:){31}[0-9a-f]{2}$/);
    expect(pair.fingerprint).toHaveLength(95);
  });

  it('genera pares distintos en cada llamada', () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    expect(a.publicKey).not.toBe(b.publicKey);
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });
});

describe('keyProtection', () => {
  it('cifra y descifra la clave privada con la misma contraseña', () => {
    const pair = generateKeyPair();
    const password = 'MiContrasena123!';

    const encrypted = encryptPrivateKey(pair.privateKey, password);
    expect(Buffer.from(encrypted.iv, 'base64').length).toBe(12);
    expect(Buffer.from(encrypted.salt, 'base64').length).toBe(16);
    expect(Buffer.from(encrypted.authTag, 'base64').length).toBe(16);

    const decrypted = decryptPrivateKey(encrypted, password);
    expect(decrypted).toBe(pair.privateKey);
  });

  it('lanza error si la contraseña es incorrecta (auth GCM)', () => {
    const pair = generateKeyPair();
    const encrypted = encryptPrivateKey(pair.privateKey, 'Correcta123!');
    expect(() => decryptPrivateKey(encrypted, 'Incorrecta456!')).toThrow();
  });

  it('pack/unpack conserva la estructura', () => {
    const pair = generateKeyPair();
    const encrypted = encryptPrivateKey(pair.privateKey, 'MiContrasena123!');
    const unpacked = unpackEncryptedKey(packEncryptedKey(encrypted));
    expect(unpacked).toEqual(encrypted);
    expect(decryptPrivateKey(unpacked, 'MiContrasena123!')).toBe(pair.privateKey);
  });

  it('usa salts aleatorias: dos cifrados del mismo texto difieren', () => {
    const pair = generateKeyPair();
    const a = encryptPrivateKey(pair.privateKey, 'MiContrasena123!');
    const b = encryptPrivateKey(pair.privateKey, 'MiContrasena123!');
    expect(a.encryptedData).not.toBe(b.encryptedData);
    expect(a.salt).not.toBe(b.salt);
  });
});

describe('signature', () => {
  it('calcula un hash SHA-256 de 64 caracteres hex', () => {
    const p = tempFile('contenido de prueba');
    const hash = calculateFileHash(p);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(calculateFileHash(p));
    fs.unlinkSync(p);
  });

  it('es sensible a cambios mínimos de contenido', () => {
    const a = tempFile('hola mundo');
    const b = tempFile('hola mund0');
    expect(calculateFileHash(a)).not.toBe(calculateFileHash(b));
    fs.unlinkSync(a);
    fs.unlinkSync(b);
  });

  it('firma un documento con RSA-SHA256 y devuelve su hash', () => {
    const p = tempFile('documento a firmar');
    const { privateKey, publicKey } = generateKeyPair();
    const result = signDocument(p, privateKey);

    expect(result.algorithm).toBe('RSA-SHA256');
    expect(result.signature).toBeTruthy();
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.contentHash).toBe(calculateFileHash(p));
    expect(result.signedAt).toBeInstanceOf(Date);

    fs.unlinkSync(p);
  });
});

describe('verification', () => {
  it('verifica como válido un documento firmado e íntegro', () => {
    const p = tempFile('documento original firmado');
    const { privateKey, publicKey } = generateKeyPair();
    const signed = signDocument(p, privateKey);

    const result = verifyDocument(p, signed.contentHash, publicKey, signed.signature);
    expect(result.isValid).toBe(true);
    expect(result.hashMatch).toBe(true);
    expect(result.signatureMatch).toBe(true);
    expect(result.reason).toBeUndefined();
    fs.unlinkSync(p);
  });

  it('detecta manipulación del contenido (hash no coincide)', () => {
    const original = tempFile('contenido original');
    const tampered = tempFile('contenido MODIFICADO');
    const { privateKey, publicKey } = generateKeyPair();
    const signed = signDocument(original, privateKey);

    const result = verifyDocument(tampered, signed.contentHash, publicKey, signed.signature);
    expect(result.isValid).toBe(false);
    expect(result.hashMatch).toBe(false);
    expect(result.signatureMatch).toBe(false);
    expect(result.reason).toContain('manipulado');

    fs.unlinkSync(original);
    fs.unlinkSync(tampered);
  });

  it('detecta firma inválida cuando se usa otra clave pública', () => {
    const p = tempFile('documento con firma de otro');
    const { privateKey } = generateKeyPair();
    const other = generateKeyPair();
    const signed = signDocument(p, privateKey);

    const result = verifyDocument(p, signed.contentHash, other.publicKey, signed.signature);
    expect(result.isValid).toBe(false);
    expect(result.hashMatch).toBe(true);
    expect(result.signatureMatch).toBe(false);
    expect(result.reason).toContain('Firma digital invalida');
    fs.unlinkSync(p);
  });
});