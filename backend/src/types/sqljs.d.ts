declare module 'sql.js' {
  export interface SqlJsValue {
    [key: string]: unknown;
  }
  export class Database {
    constructor(data?: Uint8Array);
    exec(sql: string, params?: unknown[]): { columns: string[]; values: unknown[][] }[];
    run(sql: string, params?: unknown[]): void;
    export(): Uint8Array;
    close(): void;
  }
  export interface SqlJsStatic {
    Database: typeof Database;
  }
  const initSqlJs: (config?: unknown) => Promise<SqlJsStatic>;
  export default initSqlJs;
}
