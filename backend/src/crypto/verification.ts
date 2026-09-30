import crypto from 'crypto';
import fs from 'fs';

export interface VerificationResult {
  isValid: boolean;
  hashMatch: boolean;
  signatureMatch: boolean;
  reason?: string;
}

export function verifyDocument(
  filePath: string,
  originalHash: string,
  publicKeyPem: string,
  signatureBase64: string
): VerificationResult {
  const fileBuffer = fs.readFileSync(filePath);

  const currentHash = crypto
    .createHash('sha256')
    .update(fileBuffer)
    .digest('hex');

  const hashMatch = currentHash === originalHash;

  if (!hashMatch) {
    return {
      isValid: false,
      hashMatch: false,
      signatureMatch: false,
      reason: 'El hash del documento no coincide - contenido manipulado'
    };
  }

  const contentHash = crypto
    .createHash('sha256')
    .update(fileBuffer)
    .digest();

  const verify = crypto.createVerify('SHA256');
  verify.update(contentHash);

  const signatureMatch = verify.verify(
    publicKeyPem,
    signatureBase64,
    'base64'
  );

  return {
    isValid: hashMatch && signatureMatch,
    hashMatch,
    signatureMatch,
    reason: !signatureMatch
      ? 'Firma digital invalida - posible suplantacion'
      : undefined
  };
}
