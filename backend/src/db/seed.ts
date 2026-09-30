import { initDatabase, getDatabase, saveDatabase, closeDatabase } from './connection.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateKeyPair } from '../crypto/keyGenerator.js';
import { encryptPrivateKey, packEncryptedKey } from '../crypto/keyProtection.js';

interface SeedUser {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
}

const SEED_USERS: SeedUser[] = [
  {
    username: 'admin',
    email: 'admin@tesis-documental.pe',
    password: 'Admin123!@#',
    fullName: 'Administrador del Sistema',
    role: 'admin'
  },
  {
    username: 'carlos',
    email: 'carlos.garcia@upch.pe',
    password: 'Carlos123!@#',
    fullName: 'Carlos García Mendoza',
    role: 'user'
  },
  {
    username: 'maria',
    email: 'maria.lopez@upch.pe',
    password: 'Maria123!@#',
    fullName: 'María López Ramírez',
    role: 'user'
  }
];

export async function runSeed(): Promise<void> {
  const db = await initDatabase();

  console.log('Seeding database...');

  const result = db.exec('SELECT COUNT(*) as count FROM users');
  const count = result.length > 0 ? result[0].values[0][0] as number : 0;

  if (count > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  for (const user of SEED_USERS) {
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(user.password, 12);

    // Generate cryptographic key pair
    const keyPair = generateKeyPair('RSA-2048');
    const encryptedPrivateKey = encryptPrivateKey(keyPair.privateKey, user.password);

    db.run(
      'INSERT INTO users (id, username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?, ?)',
      [id, user.username, user.email, passwordHash, user.role, user.fullName]
    );

    // Store keys
    const keyId = uuidv4();
    db.run(
      'INSERT INTO user_keys (id, user_id, public_key, encrypted_private_key, key_algorithm, key_fingerprint) VALUES (?, ?, ?, ?, ?, ?)',
      [keyId, id, keyPair.publicKey, packEncryptedKey(encryptedPrivateKey), keyPair.algorithm, keyPair.fingerprint]
    );

    console.log(`Created user: ${user.username} (${user.role}) - Keys: ${keyPair.algorithm}`);
  }

  saveDatabase();
  console.log('Seed completed successfully.');
  console.log('');
  console.log('Test users created:');
  console.log('==================');
  SEED_USERS.forEach(u => {
    console.log(`  ${u.username} / ${u.password} (${u.role})`);
  });
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  try {
    await runSeed();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}
