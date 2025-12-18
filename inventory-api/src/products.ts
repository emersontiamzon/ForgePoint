import { randomUUID } from 'crypto';
import { query } from './db';
import { Product, LowStockAlert } from './types';
import { sendLowStockAlertEmail } from './services/email';

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    sku: row.sku,
    price: Number(row.price),
    quantityOnHand: Number(row.quantity_on_hand),
    lowStockThreshold: row.low_stock_threshold ? Number(row.low_stock_threshold) : undefined,
    supplier: row.supplier ?? undefined,
    location: row.location ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function rowToLowStockAlert(row: any): LowStockAlert {
  return {
    id: row.id,
    productId: row.product_id,
    triggeredAt: row.triggered_at.toISOString(),
    acknowledgedAt: row.acknowledged_at?.toISOString(),
    acknowledgedBy: row.acknowledged_by,
    emailSent: row.email_sent,
    createdAt: row.created_at.toISOString(),
  };
}

export interface StockMovement {
  id: string;
  productId: string;
  kind: 'sale' | 'return' | 'purchase';
  quantity: number;
  createdAt: string;
}

export async function listProducts(): Promise<Product[]> {
  const res = await query('SELECT * FROM products ORDER BY created_at DESC');
  return res.rows.map(rowToProduct);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const res = await query('SELECT * FROM products WHERE id = $1', [id]);
  if (res.rowCount === 0) return undefined;
  return rowToProduct(res.rows[0]);
}

export async function createProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const id = randomUUID();
  try {
    const res = await query(
      `INSERT INTO products (id, name, description, sku, price, quantity_on_hand, low_stock_threshold, supplier, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        input.name,
        input.description ?? null,
        input.sku,
        input.price,
        input.quantityOnHand,
        input.lowStockThreshold ?? 10,
        input.supplier ?? null,
        input.location ?? null,
      ],
    );
    return rowToProduct(res.rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') {
      // unique_violation (likely SKU)
      throw new Error('SKU_ALREADY_EXISTS');
    }
    throw err;
  }
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, 'id' | 'createdAt'>>,
): Promise<Product | undefined> {
  // Load existing
  const existing = await getProduct(id);
  if (!existing) return undefined;

  // If SKU is changing, rely on DB unique constraint for conflict
  const next: Product = {
    ...existing,
    ...patch,
    updatedAt: existing.updatedAt,
  };

  try {
    const res = await query(
      `UPDATE products
       SET name = $2,
           description = $3,
           sku = $4,
           price = $5,
           quantity_on_hand = $6,
           low_stock_threshold = $7,
           supplier = $8,
           location = $9,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        next.name,
        next.description ?? null,
        next.sku,
        next.price,
        next.quantityOnHand,
        next.lowStockThreshold ?? 10,
        next.supplier ?? null,
        next.location ?? null,
      ],
    );
    if (res.rowCount === 0) return undefined;
    return rowToProduct(res.rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') {
      throw new Error('SKU_ALREADY_EXISTS');
    }
    throw err;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const res = await query('DELETE FROM products WHERE id = $1', [id]);
  return res.rowCount > 0;
}

export async function adjustStock(id: string, delta: number, kind: 'sale' | 'return' | 'purchase'): Promise<Product | undefined> {
  const resSel = await query('SELECT quantity_on_hand FROM products WHERE id = $1', [id]);
  if (resSel.rowCount === 0) return undefined;

  const current = Number(resSel.rows[0].quantity_on_hand);
  const nextQty = current + delta;
  if (nextQty < 0) {
    throw new Error('INSUFFICIENT_STOCK');
  }

  // Update product quantity
  const res = await query(
    `UPDATE products
     SET quantity_on_hand = $2,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, nextQty],
  );
  if (!res.rows || res.rowCount === 0) return undefined;
  const product = rowToProduct(res.rows[0]);

  // Record stock movement
  const movementId = randomUUID();
  await query(
    `INSERT INTO stock_movements (id, product_id, kind, quantity)
     VALUES ($1, $2, $3, $4)`,
    [movementId, id, kind, Math.abs(delta)],
  );

  // Check for low stock alert
  if (product.lowStockThreshold && product.quantityOnHand <= product.lowStockThreshold) {
    // Check if there's already an unacknowledged alert for this product
    const existingAlert = await query(
      `SELECT id FROM low_stock_alerts
       WHERE product_id = $1 AND acknowledged_at IS NULL
       ORDER BY triggered_at DESC LIMIT 1`,
      [id]
    );

    if (existingAlert.rowCount === 0) {
      // Create new alert
      const alertId = randomUUID();
      await query(
        `INSERT INTO low_stock_alerts (id, product_id, triggered_at, email_sent)
         VALUES ($1, $2, now(), FALSE)`,
        [alertId, id]
      );

      // Send email notification
      try {
        const emailSent = await sendLowStockAlertEmail(
          product.name,
          product.sku,
          product.quantityOnHand,
          product.lowStockThreshold
        );
        
        if (emailSent) {
          // Mark email as sent
          await query(
            `UPDATE low_stock_alerts
             SET email_sent = TRUE
             WHERE id = $1`,
            [alertId]
          );
        }
      } catch (emailError) {
        console.error('Failed to send low stock alert email:', emailError);
        // Email failure doesn't prevent the alert from being created
      }
    }
  }

  return product;
}

export async function listStockMovements(productId: string): Promise<StockMovement[]> {
  const res = await query(
    `SELECT id, product_id, kind, quantity, created_at
     FROM stock_movements
     WHERE product_id = $1
     ORDER BY created_at DESC`,
    [productId],
  );

  return res.rows.map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    kind: row.kind,
    quantity: Number(row.quantity),
    createdAt: row.created_at.toISOString(),
  }));
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const res = await query(
    `SELECT * FROM low_stock_alerts
     WHERE acknowledged_at IS NULL
     ORDER BY triggered_at DESC`
  );
  return res.rows.map(rowToLowStockAlert);
}

export async function acknowledgeLowStockAlert(alertId: string, userId?: string): Promise<boolean> {
  const res = await query(
    `UPDATE low_stock_alerts
     SET acknowledged_at = now(), acknowledged_by = $1
     WHERE id = $2 AND acknowledged_at IS NULL`,
    [userId, alertId]
  );
  return res.rowCount > 0;
}

export async function getProductLowStockThreshold(productId: string): Promise<number | undefined> {
  const res = await query(
    `SELECT low_stock_threshold FROM products WHERE id = $1`,
    [productId]
  );
  if (res.rowCount === 0) return undefined;
  return res.rows[0].low_stock_threshold ? Number(res.rows[0].low_stock_threshold) : undefined;
}

export async function setProductLowStockThreshold(productId: string, threshold: number): Promise<boolean> {
  const res = await query(
    `UPDATE products
     SET low_stock_threshold = $1, updated_at = now()
     WHERE id = $2`,
    [threshold, productId]
  );
  return res.rowCount > 0;
}
