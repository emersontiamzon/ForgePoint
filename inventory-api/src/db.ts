import { Pool, QueryResult } from 'pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://postgres:Ekunebalu@localhost:5432/inventory_db';

const pool = new Pool({ connectionString });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sku TEXT NOT NULL UNIQUE,
      price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      quantity_on_hand INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      supplier TEXT,
      location TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id UUID PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS low_stock_alerts (
      id UUID PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      acknowledged_at TIMESTAMPTZ,
      acknowledged_by UUID,
      email_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function query<T = unknown>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query(text, params);
}
