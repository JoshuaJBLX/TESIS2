import crypto from 'crypto';
import fs from 'fs';

export interface SignatureResult {
  signature: string;
  algorithm: string;
  signedAt: Date;
  contentHash: string;
}

export function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export function signDocument(filePath: string, privateKeyPem: string): SignatureResult {
  const fileBuffer = fs.readFileSync(filePath);

  const contentHash = crypto
    .createHash('sha256')
    .update(fileBuffer)
    .digest();

  const sign = crypto.createSign('SHA256');
  sign.update(contentHash);

  const signature = sign.sign(privateKeyPem, 'base64');

  return {
    signature,
    algorithm: 'RSA-SHA256',
    signedAt: new Date(),
    contentHash: contentHash.toString('hex')
  };
}
