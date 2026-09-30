import { getDatabase } from '../db/connection.js';
export function queryOne(sql: string, params: any[] = []): any | null {
  const db = getDatabase();
  const result = db.exec(sql, params);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  
  const obj: any = {};
  columns.forEach((col: string, i: number) => {
    obj[col] = row[i];
  });
  
  return obj;
}

export function queryAll(sql: string, params: any[] = []): any[] {
  const db = getDatabase();
  const result = db.exec(sql, params);
  
  if (result.length === 0) {
    return [];
  }
  
  const columns = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

export function run(sql: string, params: any[] = []): void {
  const db = getDatabase();
  db.run(sql, params);
}
