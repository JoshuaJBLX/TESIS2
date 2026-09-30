import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export type ComparisonMode = 'text' | 'pdf' | 'docx' | 'binary';

export interface ComparableArtifact {
  label: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  hash: string;
  sourceLabel?: string;
  versionNumber?: number;
}

export interface ExtractedText {
  mode: ComparisonMode;
  text: string;
  reason?: string;
}

export interface LineDiff {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

export interface MetadataChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface ComparisonResult {
  mode: ComparisonMode | 'mixed';
  supported: boolean;
  metadata: MetadataChange[];
  lineDiffs: LineDiff[];
  summary: {
    additions: number;
    deletions: number;
    unchanged: number;
    textReady: boolean;
  };
  base: {
    label: string;
    fileName: string;
    versionNumber?: number;
  };
  target: {
    label: string;
    fileName: string;
    versionNumber?: number;
  };
  note?: string;
}

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json', '.xml', '.yaml', '.yml', '.log']);

function runPythonExtraction(filePath: string, mimeType: string, fileName: string): ExtractedText {
  const script = [
    'import json, os, sys, zipfile, xml.etree.ElementTree as ET',
    'path = sys.argv[1]',
    'mime = sys.argv[2].lower()',
    'name = sys.argv[3].lower()',
    'ext = os.path.splitext(name or path)[1].lower()',
    'def emit(mode, text, reason=None):',
    '    payload = {"mode": mode, "text": text}',
    '    if reason:',
    '        payload["reason"] = reason',
    '    print(json.dumps(payload, ensure_ascii=False))',
    'if mime.startswith("text/") or ext in {".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml", ".log"}:',
    '    with open(path, "r", encoding="utf-8", errors="ignore") as fh:',
    '        emit("text", fh.read())',
    'elif ext == ".pdf" or mime == "application/pdf":',
    '    try:',
    '        import pdfplumber',
    '        parts = []',
    '        with pdfplumber.open(path) as pdf:',
    '            for page in pdf.pages:',
    '                parts.append(page.extract_text() or "")',
    '        emit("pdf", "\\n".join(parts))',
    '    except Exception:',
    '        try:',
    '            from PyPDF2 import PdfReader',
    '            parts = []',
    '            reader = PdfReader(path)',
    '            for page in reader.pages:',
    '                parts.append(page.extract_text() or "")',
    '            emit("pdf", "\\n".join(parts))',
    '        except Exception as exc:',
    '            emit("binary", "", str(exc))',
    'elif ext == ".docx" or mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":',
    '    try:',
    '        with zipfile.ZipFile(path) as zf:',
    '            xml = zf.read("word/document.xml")',
    '        root = ET.fromstring(xml)',
    '        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}',
    '        paragraphs = []',
    '        for paragraph in root.findall(".//w:p", ns):',
    '            pieces = []',
    '            for node in paragraph.findall(".//w:t", ns):',
    '                if node.text:',
    '                    pieces.append(node.text)',
    '            if pieces:',
    '                paragraphs.append("".join(pieces))',
    '        emit("docx", "\\n".join(paragraphs))',
    '    except Exception as exc:',
    '        emit("binary", "", str(exc))',
    'else:',
    '    emit("binary", "", "unsupported")'
  ].join('\n');

  const result = spawnSync('python', ['-c', script, filePath, mimeType, fileName], { encoding: 'utf8' });
  if (result.status !== 0 || !result.stdout) {
    return { mode: 'binary', text: '', reason: result.stderr || 'No se pudo extraer texto legible' };
  }

  try {
    const parsed = JSON.parse(result.stdout.trim()) as ExtractedText;
    return parsed;
  } catch {
    return { mode: 'binary', text: '', reason: 'No se pudo interpretar la salida de extracción' };
  }
}

export function extractComparableText(filePath: string, mimeType: string, fileName: string): ExtractedText {
  const ext = path.extname(fileName || filePath).toLowerCase();
  if (mimeType.toLowerCase().startsWith('text/') || TEXT_EXTENSIONS.has(ext)) {
    try {
      return { mode: 'text', text: fs.readFileSync(filePath, 'utf8') };
    } catch {
      return runPythonExtraction(filePath, mimeType, fileName);
    }
  }

  return runPythonExtraction(filePath, mimeType, fileName);
}

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function buildLineDiff(baseLines: string[], targetLines: string[]): LineDiff[] {
  const rows = baseLines.length;
  const cols = targetLines.length;
  const table: number[][] = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      table[i][j] = baseLines[i] === targetLines[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const diffs: LineDiff[] = [];
  let i = 0;
  let j = 0;

  while (i < rows && j < cols) {
    if (baseLines[i] === targetLines[j]) {
      diffs.push({ type: 'equal', text: baseLines[i] });
      i += 1;
      j += 1;
      continue;
    }

    if (table[i + 1][j] >= table[i][j + 1]) {
      diffs.push({ type: 'delete', text: baseLines[i] });
      i += 1;
    } else {
      diffs.push({ type: 'insert', text: targetLines[j] });
      j += 1;
    }
  }

  while (i < rows) {
    diffs.push({ type: 'delete', text: baseLines[i] });
    i += 1;
  }

  while (j < cols) {
    diffs.push({ type: 'insert', text: targetLines[j] });
    j += 1;
  }

  return diffs;
}

export function compareComparableArtifacts(base: ComparableArtifact, target: ComparableArtifact): ComparisonResult {
  const baseText = extractComparableText(base.filePath, base.mimeType, base.fileName);
  const targetText = extractComparableText(target.filePath, target.mimeType, target.fileName);
  const metadata: MetadataChange[] = [];

  if (base.fileName !== target.fileName) {
    metadata.push({ field: 'file_name', label: 'Nombre del archivo', before: base.fileName, after: target.fileName });
  }
  if (base.mimeType !== target.mimeType) {
    metadata.push({ field: 'mime_type', label: 'Tipo MIME', before: base.mimeType, after: target.mimeType });
  }
  if (base.size !== target.size) {
    metadata.push({
      field: 'file_size',
      label: 'Tamaño',
      before: `${(base.size / 1024).toFixed(1)} KB`,
      after: `${(target.size / 1024).toFixed(1)} KB`
    });
  }
  if (base.hash !== target.hash) {
    metadata.push({
      field: 'content_hash',
      label: 'Hash SHA-256',
      before: `${base.hash.slice(0, 18)}…`,
      after: `${target.hash.slice(0, 18)}…`
    });
  }
  if (base.sourceLabel !== target.sourceLabel) {
    metadata.push({
      field: 'origin',
      label: 'Origen',
      before: base.sourceLabel || base.label,
      after: target.sourceLabel || target.label
    });
  }

  const baseLines = normalizeLines(baseText.text);
  const targetLines = normalizeLines(targetText.text);
  const textReady = Boolean(baseLines.length && targetLines.length && (baseText.mode !== 'binary' || targetText.mode !== 'binary'));
  const lineDiffs = textReady ? buildLineDiff(baseLines, targetLines) : [];

  const additions = lineDiffs.filter((diff) => diff.type === 'insert').length;
  const deletions = lineDiffs.filter((diff) => diff.type === 'delete').length;
  const unchanged = lineDiffs.filter((diff) => diff.type === 'equal').length;
  const binaryPair = baseText.mode === 'binary' || targetText.mode === 'binary';

  return {
    mode: binaryPair ? 'mixed' : (baseText.mode === targetText.mode ? baseText.mode : 'mixed'),
    supported: textReady,
    metadata,
    lineDiffs,
    summary: {
      additions,
      deletions,
      unchanged,
      textReady
    },
    base: {
      label: base.label,
      fileName: base.fileName,
      versionNumber: base.versionNumber
    },
    target: {
      label: target.label,
      fileName: target.fileName,
      versionNumber: target.versionNumber
    },
    note: textReady ? undefined : 'No se pudo extraer texto legible de uno o ambos archivos; se muestra comparación de metadatos.'
  };
}
