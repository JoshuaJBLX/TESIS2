import crypto from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  algorithm: string;
}

export function generateKeyPair(algorithm: 'RSA-2048' = 'RSA-2048'): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  const fingerprint = crypto
    .createHash('sha256')
    .update(publicKey)
    .digest('hex')
    .match(/.{2}/g)!
    .join(':');

  return { publicKey, privateKey, fingerprint, algorithm };
}
