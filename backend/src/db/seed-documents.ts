import fs from 'fs';
import os from 'os';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, getDatabase, saveDatabase, closeDatabase } from './connection.js';
import { runMigration } from './migrate.js';
import { queryOne } from './query.js';
import { documentService } from '../services/document.service.js';
import { generateKeyPair } from '../crypto/keyGenerator.js';
import { encryptPrivateKey, packEncryptedKey } from '../crypto/keyProtection.js';

interface SeedUserRef {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'user';
}

const ALL_USERS: SeedUserRef[] = [
  { username: 'admin', email: 'admin@tesis-documental.pe', password: 'Admin123!@#', fullName: 'Administrador del Sistema', role: 'admin' },
  { username: 'carlos', email: 'carlos.garcia@upch.pe', password: 'Carlos123!@#', fullName: 'Carlos García Mendoza', role: 'user' },
  { username: 'maria', email: 'maria.lopez@upch.pe', password: 'Maria123!@#', fullName: 'María López Ramírez', role: 'user' },
  { username: 'lucia', email: 'lucia.torres@upch.pe', password: 'Lucia123!@#', fullName: 'Lucía Torres Vega', role: 'user' },
  { username: 'pedro', email: 'pedro.diaz@upch.pe', password: 'Pedro123!@#', fullName: 'Pedro Díaz Salazar', role: 'user' }
];

function writeTemp(content: string, fileExt: string): { filePath: string; originalName: string; fileSize: number } {
  const originalName = `documento-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = path.join(os.tmpdir(), originalName);
  fs.writeFileSync(filePath, content, 'utf8');
  return { filePath, originalName, fileSize: Buffer.byteLength(content, 'utf8') };
}

function cleanupTemp(filePath: string): void {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function ensureUser(user: SeedUserRef): string {
  const existing = queryOne('SELECT id FROM users WHERE username = ?', [user.username]);
  if (existing) return existing.id;

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(user.password, 12);
  const keyPair = generateKeyPair('RSA-2048');
  const encryptedPrivateKey = encryptPrivateKey(keyPair.privateKey, user.password);

  const db = getDatabase();
  db.run(
    'INSERT INTO users (id, username, email, password_hash, role, full_name) VALUES (?, ?, ?, ?, ?, ?)',
    [id, user.username, user.email, passwordHash, user.role, user.fullName]
  );
  db.run(
    'INSERT INTO user_keys (id, user_id, public_key, encrypted_private_key, key_algorithm, key_fingerprint) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), id, keyPair.publicKey, packEncryptedKey(encryptedPrivateKey), keyPair.algorithm, keyPair.fingerprint]
  );
  console.log(`  [user] creado ${user.username} (${user.role})`);
  return id;
}

function documentExists(title: string): boolean {
  return Boolean(queryOne('SELECT id FROM documents WHERE title = ?', [title]));
}

async function uploadDoc(owner: SeedUserRef, opts: { title: string; description?: string; changeDescription?: string; content: string }): Promise<string> {
  const file = writeTemp(opts.content, 'txt');
  try {
    const result = await documentService.uploadDocument(
      file.filePath,
      file.originalName,
      'text/plain',
      file.fileSize,
      opts.title,
      opts.description || null,
      opts.changeDescription || 'Versión inicial',
      ensureUser(owner),
      owner.password
    );
    console.log(`    + ${opts.title} -> versión ${result.versionNumber}`);
    return result.documentId;
  } finally {
    cleanupTemp(file.filePath);
  }
}

async function updateDoc(owner: SeedUserRef, documentId: string, changeDescription: string, content: string): Promise<void> {
  const file = writeTemp(content, 'txt');
  try {
    const result = await documentService.updateDocument(
      documentId,
      file.filePath,
      file.originalName,
      'text/plain',
      file.fileSize,
      changeDescription,
      ensureUser(owner),
      owner.password
    );
    console.log(`    ~ ${changeDescription} -> versión ${result.versionNumber}`);
  } finally {
    cleanupTemp(file.filePath);
  }
}

async function shareDoc(owner: SeedUserRef, documentId: string): Promise<void> {
  await documentService.setDocumentVisibility(documentId, ensureUser(owner), true);
}

async function createProposal(proposer: SeedUserRef, documentId: string, changeDescription: string, content: string): Promise<string> {
  const file = writeTemp(content, 'txt');
  try {
    const result = await documentService.createProposal(
      documentId,
      file.filePath,
      file.originalName,
      'text/plain',
      file.fileSize,
      changeDescription,
      ensureUser(proposer),
      proposer.password
    );
    console.log(`    ? propuesta de ${proposer.username}: ${changeDescription}`);
    return result.proposalId;
  } finally {
    cleanupTemp(file.filePath);
  }
}

async function acceptProposal(owner: SeedUserRef, documentId: string, proposalId: string): Promise<void> {
  const result = await documentService.acceptProposal(documentId, proposalId, ensureUser(owner), owner.password);
  console.log(`    ✔ propuesta aceptada -> versión ${result.versionNumber} (coautor ${result.coauthorUsername})`);
}

async function rejectProposal(owner: SeedUserRef, documentId: string, proposalId: string): Promise<void> {
  await documentService.rejectProposal(documentId, proposalId, ensureUser(owner));
  console.log(`    ✘ propuesta rechazada`);
}

async function seedCarlos(): Promise<void> {
  const carlos = ALL_USERS.find(u => u.username === 'carlos')!;
  const maria = ALL_USERS.find(u => u.username === 'maria')!;

  // 1) Contrato con evolución de 3 versiones + 1 propuesta aceptada (coautoría)
  const contrato = 'Contrato de Servicios de Mantenimiento';
  if (!documentExists(contrato)) {
    console.log(`\n${carlos.username}: ${contrato}`);
    const docId = await uploadDoc(carlos, {
      title: contrato,
      description: 'Contrato marco de mantenimiento de equipos',
      changeDescription: 'Borrador inicial del contrato',
      content: ['CONTRATO DE SERVICIOS DE MANTENIMIENTO', '', 'Artículo 1. Objeto', 'El proveedor prestará el servicio de mantenimiento preventivo y correctivo.',
        'Artículo 2. Alcance', 'Cubre los equipos listados en el anexo A.', 'Artículo 3. Vigencia', 'Doce meses renovables.'].join('\n')
    });
    await updateDoc(carlos, docId, 'Inclusión de cláusula de penalidades', 
      ['CONTRATO DE SERVICIOS DE MANTENIMIENTO', '', 'Artículo 1. Objeto', 'El proveedor prestará el servicio de mantenimiento preventivo y correctivo.',
        'Artículo 2. Alcance', 'Cubre los equipos listados en el anexo A.', 'Artículo 3. Vigencia', 'Doce meses renovables.',
        'Artículo 4. Penalidades', 'Se aplicará 1% del monto mensual por día de retraso.'].join('\n'));
    await updateDoc(carlos, docId, 'Revisión legal final', 
      ['CONTRATO DE SERVICIOS DE MANTENIMIENTO', '', 'Artículo 1. Objeto', 'El proveedor prestará el servicio de mantenimiento preventivo y correctivo.',
        'Artículo 2. Alcance', 'Cubre los equipos listados en el anexo A.', 'Artículo 3. Vigencia', 'Doce meses renovables.',
        'Artículo 4. Penalidades', 'Se aplicará 1.5% del monto mensual por día de retraso, tope 10%.',
        'Artículo 5. Resolución', 'El contrato podrá resolverse por mutuo acuerdo.'].join('\n'));
    await shareDoc(carlos, docId);
    const prop = await createProposal(maria, docId, 'Ajustar monto de penalidad y cláusula de pagos',
      'CONTRATO DE SERVICIOS DE MANTENIMIENTO\n\nArtículo 1. Objeto\nEl proveedor prestará el servicio de mantenimiento preventivo y correctivo.\nArtículo 2. Alcance\nCubre los equipos listados en el anexo A.\nArtículo 3. Vigencia\nDoce meses renovables.\nArtículo 4. Penalidades\nSe aplicará 1.5% del monto mensual por día de retraso, tope 10%.\nArtículo 5. Resolución\nEl contrato podrá resolverse por mutuo acuerdo.\nArtículo 6. Pagos\nPagos a 30 días calendario tras la emisión de la factura.');
    await acceptProposal(carlos, docId, prop);
  }

  // 2) Informe privado con 2 versiones
  const informe = 'Informe Financiero del Primer Trimestre';
  if (!documentExists(informe)) {
    console.log(`\n${carlos.username}: ${informe}`);
    const docId = await uploadDoc(carlos, {
      title: informe,
      description: 'Reporte financiero interno (privado)',
      changeDescription: 'Cifras preliminares',
      content: ['INFORME FINANCIERO - TRIMESTRE 1', '', 'Ingresos: S/ 850,000', 'Gastos: S/ 620,000', 'Estas cifras están pendientes de conciliación.'].join('\n')
    });
    await updateDoc(carlos, docId, 'Cifras auditadas por contabilidad',
      ['INFORME FINANCIERO - TRIMESTRE 1', '', 'Ingresos: S/ 845,320', 'Gastos: S/ 618,975', 'Resultado: S/ 226,345', 'Cifras conciliadas y auditadas.'].join('\n'));
  }

  // 3) Manual público con propuestas pendiente y rechazada
  const manual = 'Manual de Procedimientos del Área de TI';
  if (!documentExists(manual)) {
    console.log(`\n${carlos.username}: ${manual}`);
    const docId = await uploadDoc(carlos, {
      title: manual,
      description: 'Manual operativo del área de tecnologías',
      changeDescription: 'Procedimientos iniciales de mesa de ayuda',
      content: ['MANUAL DE PROCEDIMIENTOS - TI', '', '1. Registro de tickets', '2. Asignación de prioridades', '3. Escalamiento a soporte de aplicaciones.'].join('\n')
    });
    await shareDoc(carlos, docId);
    const propPedro = await createProposal(ALL_USERS.find(u => u.username === 'pedro')!, docId, 'Agregar procedimiento de incidentes de seguridad',
      'MANUAL DE PROCEDIMIENTOS - TI\n\n1. Registro de tickets\n2. Asignación de prioridades\n3. Escalamiento a soporte de aplicaciones.\n4. Gestión de incidentes de seguridad\n5. Notificación al responsable de seguridad en menos de 1 hora.');
    const propLucia = await createProposal(ALL_USERS.find(u => u.username === 'lucia')!, docId, 'Eliminar procedimiento de escalamiento redundante',
      'MANUAL DE PROCEDIMIENTOS - TI\n\n1. Registro de tickets\n2. Asignación de prioridades');
    // Se deja pendiente la de Pedro y se rechaza la de Lucía
    await rejectProposal(carlos, docId, propLucia);
    console.log(`    ? propuesta de pedro queda pendiente`);
  }
}

async function seedMaria(): Promise<void> {
  const maria = ALL_USERS.find(u => u.username === 'maria')!;
  const carlos = ALL_USERS.find(u => u.username === 'carlos')!;

  // 4) Política con 3 versiones + 1 propuesta aceptada
  const politica = 'Política de Seguridad de la Información';
  if (!documentExists(politica)) {
    console.log(`\n${maria.username}: ${politica}`);
    const docId = await uploadDoc(maria, {
      title: politica,
      description: 'Política corporativa de seguridad de la información',
      changeDescription: 'Política base',
      content: ['POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN', '', '1. Clasificación de la información.', '2. Control de accesos.', '3. Gestión de contraseñas.'].join('\n')
    });
    await updateDoc(maria, docId, 'Revisión del área de cumplimiento',
      ['POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN', '', '1. Clasificación de la información.', '2. Control de accesos.', '3. Gestión de contraseñas.', '4. Registro de accesos privilegiados.'].join('\n'));
    await updateDoc(maria, docId, 'Actualización normativa 2026',
      ['POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN', '', '1. Clasificación de la información.', '2. Control de accesos.', '3. Gestión de contraseñas.', '4. Registro de accesos privilegiados.', '5. Notificación de incidentes en máximo 24 horas.'].join('\n'));
    await shareDoc(maria, docId);
    const prop = await createProposal(carlos, docId, 'Reorganizar la sección de clasificación de la información',
      'POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN\n\n1. Control de accesos.\n2. Clasificación de la información (pública, interna, confidencial).\n3. Gestión de contraseñas.\n4. Registro de accesos privilegiados.\n5. Notificación de incidentes en máximo 24 horas.');
    await acceptProposal(maria, docId, prop);
  }

  // 5) Informe privado de auditoría con 2 versiones
  const auditoria = 'Auditoría Interna 2025';
  if (!documentExists(auditoria)) {
    console.log(`\n${maria.username}: ${auditoria}`);
    const docId = await uploadDoc(maria, {
      title: auditoria,
      description: 'Informe de auditoría interna (privado)',
      changeDescription: 'Hallazgos preliminares',
      content: ['INFORME DE AUDITORÍA INTERNA 2025', '', 'Hallazgo 1: control de cambios sin documentar.', 'Hallazgo 2: accesos compartidos en dos sistemas.'].join('\n')
    });
    await updateDoc(maria, docId, 'Informe final de auditoría',
      ['INFORME DE AUDITORÍA INTERNA 2025', '', 'Hallazgo 1: control de cambios sin documentar. (Medio)', 'Hallazgo 2: accesos compartidos en dos sistemas. (Bajo)', 'Hallazgo 3: backups no verificados. (Alto)', 'Plan de acción propuesto en el anexo B.'].join('\n'));
  }

  // 6) Guía pública con propuesta pendiente
  const guia = 'Guía de Buenas Prácticas Documentales';
  if (!documentExists(guia)) {
    console.log(`\n${maria.username}: ${guia}`);
    const docId = await uploadDoc(maria, {
      title: guia,
      description: 'Guía para la gestión documental interna',
      changeDescription: 'Guía inicial',
      content: ['GUÍA DE BUENAS PRÁCTICAS DOCUMENTALES', '', '1. Nombrar los archivos con fecha y versión.', '2. Archivar en la carpeta correspondiente.', '3. Solicitar firma digital para versiones finales.'].join('\n')
    });
    await shareDoc(maria, docId);
    await createProposal(carlos, docId, 'Añadir sección de digitalización y escaneo',
      'GUÍA DE BUENAS PRÁCTICAS DOCUMENTALES\n\n1. Nombrar los archivos con fecha y versión.\n2. Archivar en la carpeta correspondiente.\n3. Solicitar firma digital para versiones finales.\n4. Digitalizar a 300 DPI en formato PDF/A.\n5. Escaneo verificable contra el original.');
  }
}

async function seedAdmin(): Promise<void> {
  const admin = ALL_USERS.find(u => u.username === 'admin')!;
  const maria = ALL_USERS.find(u => u.username === 'maria')!;
  const lucia = ALL_USERS.find(u => u.username === 'lucia')!;

  // 7) Reglamento con 3 versiones + propuestas rechazada y pendiente
  const reglamento = 'Reglamento del Sistema de Gestión Documental';
  if (!documentExists(reglamento)) {
    console.log(`\n${admin.username}: ${reglamento}`);
    const docId = await uploadDoc(admin, {
      title: reglamento,
      description: 'Reglamento oficial del sistema documental',
      changeDescription: 'Reglamento inicial',
      content: ['REGLAMENTO DEL SISTEMA DE GESTIÓN DOCUMENTAL', '', 'Artículo 1. Ámbito de aplicación.', 'Artículo 2. Responsables.', 'Artículo 3. Registro de documentos.'].join('\n')
    });
    await updateDoc(admin, docId, 'Incorporación de firma digital',
      ['REGLAMENTO DEL SISTEMA DE GESTIÓN DOCUMENTAL', '', 'Artículo 1. Ámbito de aplicación.', 'Artículo 2. Responsables.', 'Artículo 3. Registro de documentos.', 'Artículo 4. Firma digital obligatoria para versiones oficiales.'].join('\n'));
    await updateDoc(admin, docId, 'Ajustes de auditoría y trazabilidad',
      ['REGLAMENTO DEL SISTEMA DE GESTIÓN DOCUMENTAL', '', 'Artículo 1. Ámbito de aplicación.', 'Artículo 2. Responsables.', 'Artículo 3. Registro de documentos.', 'Artículo 4. Firma digital obligatoria para versiones oficiales.', 'Artículo 5. Trazabilidad de auditoría inmutable.'].join('\n'));
    await shareDoc(admin, docId);
    const propMaria = await createProposal(maria, docId, 'Modificar el artículo 5 sobre trazabilidad',
      'REGLAMENTO DEL SISTEMA DE GESTIÓN DOCUMENTAL\n\nArtículo 1. Ámbito de aplicación.\nArtículo 2. Responsables.\nArtículo 3. Registro de documentos.\nArtículo 4. Firma digital obligatoria para versiones oficiales.\nArtículo 5. Trazabilidad de auditoría inmutable.\nArtículo 6. Conservación mínima de 10 años.');
    const propLucia = await createProposal(lucia, docId, 'Añadir artículo sobre conservación documental',
      'REGLAMENTO DEL SISTEMA DE GESTIÓN DOCUMENTAL\n\nArtículo 1. Ámbito de aplicación.\nArtículo 2. Responsables.\nArtículo 3. Registro de documentos.\nArtículo 4. Firma digital obligatoria para versiones oficiales.\nArtículo 5. Trazabilidad de auditoría inmutable.\nArtículo 6. Conservación mínima de 7 años.');
    await rejectProposal(admin, docId, propMaria);
    console.log(`    ? propuesta de lucia queda pendiente`);
  }

  // 8) Plan estratégico privado con 2 versiones
  const plan = 'Plan Estratégico 2026-2030';
  if (!documentExists(plan)) {
    console.log(`\n${admin.username}: ${plan}`);
    const docId = await uploadDoc(admin, {
      title: plan,
      description: 'Plan estratégico institucional (privado)',
      changeDescription: 'Borrador del plan',
      content: ['PLAN ESTRATÉGICO 2026-2030', '', 'Eje 1: Transformación digital.', 'Eje 2: Transparencia institucional.', 'Eje 3: Gestión del conocimiento.'].join('\n')
    });
    await updateDoc(admin, docId, 'Versión aprobada por el directorio',
      ['PLAN ESTRATÉGICO 2026-2030', '', 'Eje 1: Transformación digital.', 'Eje 2: Transparencia institucional.', 'Eje 3: Gestión del conocimiento.', 'Meta 2030: 90% de trámites en línea.', 'Meta 2030: 100% de documentos con firma digital.'].join('\n'));
  }
}

async function seedLucia(): Promise<void> {
  const lucia = ALL_USERS.find(u => u.username === 'lucia')!;
  const pedro = ALL_USERS.find(u => u.username === 'pedro')!;

  // 9) Memoria pública con propuesta pendiente
  const memoria = 'Memoria del Proyecto de Sostenibilidad';
  if (!documentExists(memoria)) {
    console.log(`\n${lucia.username}: ${memoria}`);
    const docId = await uploadDoc(lucia, {
      title: memoria,
      description: 'Memoria del proyecto de responsabilidad social',
      changeDescription: 'Memoria inicial',
      content: ['MEMORIA DEL PROYECTO DE SOSTENIBILIDAD', '', 'Resumen ejecutivo.', 'Actividades realizadas.', 'Resultados preliminares.'].join('\n')
    });
    await shareDoc(lucia, docId);
    await createProposal(pedro, docId, 'Completar el capítulo de resultados',
      'MEMORIA DEL PROYECTO DE SOSTENIBILIDAD\n\nResumen ejecutivo.\nActividades realizadas.\nResultados preliminares.\nResultados: 240 beneficiarios, 6 talleres, 12 aliados.');
  }
}

async function seedPedro(): Promise<void> {
  const pedro = ALL_USERS.find(u => u.username === 'pedro')!;

  // 10) Diseño privado con 2 versiones
  const diseno = 'Diseño de la Plataforma de Firma Digital';
  if (!documentExists(diseno)) {
    console.log(`\n${pedro.username}: ${diseno}`);
    const docId = await uploadDoc(pedro, {
      title: diseno,
      description: 'Documento técnico de arquitectura (privado)',
      changeDescription: 'Arquitectura propuesta',
      content: ['DISEÑO DE LA PLATAFORMA DE FIRMA DIGITAL', '', '1. Componentes del backend.', '2. Almacenamiento de llaves.', '3. API REST para verificación.'].join('\n')
    });
    await updateDoc(pedro, docId, 'Arquitectura revisada con doble firma',
      ['DISEÑO DE LA PLATAFORMA DE FIRMA DIGITAL', '', '1. Componentes del backend.', '2. Almacenamiento de llaves.', '3. API REST para verificación.', '4. Soporte de coautoría con doble firma.', '5. Comparación de versiones por diff.'].join('\n'));
  }
}

export async function runSeedDocuments(): Promise<void> {
  const db = await initDatabase();
  await runMigration();

  console.log('Sembrando documentos de ejemplo...');

  // Asegura que existen todos los usuarios (los ya creados se reutilizan)
  for (const user of ALL_USERS) {
    ensureUser(user);
  }

  await seedCarlos();
  await seedMaria();
  await seedAdmin();
  await seedLucia();
  await seedPedro();

  saveDatabase();
  console.log('\nSeed de documentos completado.');
  console.log('==================');
  console.log('Usuarios y documentos de ejemplo disponibles:');
  for (const u of ALL_USERS) {
    const count = queryOne('SELECT COUNT(*) as c FROM documents d JOIN users uu ON d.owner_id = uu.id WHERE uu.username = ?', [u.username]);
    console.log(`  ${u.username} (${u.role}): ${count?.c ?? 0} documentos`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed-documents.ts')) {
  try {
    await runSeedDocuments();
  } catch (error) {
    console.error('Seed de documentos falló:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}