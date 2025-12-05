import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {

  private sqliteConnection: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'sippa-db';

  constructor() {
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  public async getDb(): Promise<SQLiteDBConnection> {
    if (!this.db) {
      await this.initializeDatabase();
    }
    return this.db!;
  }

  /* -------------------------------------------------------------
     INITIAL DATABASE SETUP
     ------------------------------------------------------------- */
  async initializeDatabase() {
    this.db = await this.sqliteConnection.createConnection(
      this.dbName,
      false,
      'no-encryption',
      1,
      false
    );

    await this.db.open();

    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS local_auth (
                                               id INTEGER PRIMARY KEY,
                                               user_email TEXT NOT NULL
       );`,
      `CREATE TABLE IF NOT EXISTS sync_deltas (
                                                delta_id INTEGER PRIMARY KEY,
                                                table_name TEXT NOT NULL,
                                                record_id TEXT NOT NULL,
                                                operation TEXT NOT NULL,
                                                data_json TEXT,
                                                timestamp TEXT NOT NULL
       );`,
      `CREATE TABLE IF NOT EXISTS unidad_medida (
                                                  unmed_id INTEGER PRIMARY KEY,
                                                  unmed_nombre TEXT NOT NULL
       );`,
      `CREATE TABLE IF NOT EXISTS ingredientes (
                                                 ing_id INTEGER PRIMARY KEY,
                                                 ing_nombre TEXT NOT NULL,
                                                 ing_unmed_id INTEGER
       );`
    ];

    for (const query of tableQueries) {
      await this.db.execute(query);
    }
  }

  /* -------------------------------------------------------------
     LOCAL AUTH STORAGE
     ------------------------------------------------------------- */

  async setLocalAuth(email: string) {
    const db = await this.getDb();

    // Usamos transacción para asegurar que la limpieza y la inserción sean atómicas
    await db.executeSet([
      { statement: 'DELETE FROM local_auth', values: [] },
      { statement: `INSERT INTO local_auth (id, user_email) VALUES (1, ?)`, values: [email] }
    ]);
  }

  async checkLocalAuth(email: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      const res = await db.query('SELECT user_email FROM local_auth LIMIT 1');

      // 🚨 CORRECCIÓN TIPADO: Asegurar el retorno booleano
      if (res.values && res.values.length > 0) {
        return res.values[0].user_email === email;
      }
      return false;
    } catch {
      return false;
    }
  }

  /** 🚨 NUEVO MÉTODO: Verificación simple de existencia de sesión para el Auth Guard */
  async hasLocalAuthEntry(): Promise<boolean> {
    try {
      const db = await this.getDb();
      const res = await db.query('SELECT 1 FROM local_auth LIMIT 1');
      // Uso de !! para asegurar un retorno boolean y evitar errores de tipado
      return !!(res.values && res.values.length > 0);
    } catch {
      return false;
    }
  }

  /* -------------------------------------------------------------
     GENERIC SQL OPERATIONS
     ------------------------------------------------------------- */

  async executeRun(statement: string, values: any[] = []) {
    const db = await this.getDb();
    return await db.run(statement, values);
  }

  async query(statement: string, values: any[] = []) {
    const db = await this.getDb();
    return await db.query(statement, values);
  }
}
