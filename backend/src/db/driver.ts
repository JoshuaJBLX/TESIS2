/**
 * Contrato minimo de acceso a datos.
 *
 * Todo el codigo de la aplicacion depende de esta interfaz y no del motor
 * concreto, lo que permite ejecutar el mismo backend sobre SQLite (local) y
 * sobre PostgreSQL / Supabase (nube) sin cambios en las capas de negocio.
 */
export interface SqlResultSet {
  columns: string[];
  values: any[][];
}

export interface DbDriver {
  /** Motor efectivo: `sqlite` o `postgresql`. */
  readonly engine: 'sqlite' | 'postgresql';
  /** Ejecuta sentencias de escritura (INSERT/UPDATE/DDL). */
  run(sql: string, params?: unknown[]): void;
  /** Ejecuta consultas y devuelve el resultado con la misma forma que `sql.js`. */
  exec(sql: string, params?: unknown[]): SqlResultSet[];
  /** Persiste el estado pendiente. Noop en PostgreSQL. */
  save(): void;
  /** Libera los recursos abiertos. */
  close(): void;
}

export const PLACEHOLDER = '?';

/**
 * Convierte los marcadores `?` de SQLite a los numerados `$1, $2, ...` que
 * espera PostgreSQL, sin tocar los `?` que formen parte de un literal.
 */
export function toPositionalPlaceholders(sql: string, params: unknown[]): string {
  let index = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  let output = '';
  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];

    if (char === "'" && sql[i - 1] !== '\\' && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      output += char;
      continue;
    }
    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      output += char;
      continue;
    }
    if (char === '?' && !inSingleQuote && !inDoubleQuote) {
      index += 1;
      output += `$${index}`;
      continue;
    }
    output += char;
  }

  if (params.length && index !== params.length) {
    throw new Error(
      `Numero de marcadores (${index}) distinto al numero de parametros (${params.length})`
    );
  }

  return output;
}
