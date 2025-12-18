import { query } from './db';

export interface InventoryValueReport {
  totalValue: number;
  breakdown: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    totalValue: number;
    supplier?: string;
  }[];
}

export interface InventoryTurnoverReport {
  period: {
    startDate: string;
    endDate: string;
  };
  turnoverData: {
    productId: string;
    productName: string;
    sku: string;
    beginningStock: number;
    purchases: number;
    sales: number;
    endingStock: number;
    turnoverRate: number;
  }[];
}

export async function generateInventoryValueReport(): Promise<InventoryValueReport> {
  const res = await query(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.price,
      p.quantity_on_hand,
      p.supplier,
      (p.price * p.quantity_on_hand) as total_value
    FROM products p
    ORDER BY total_value DESC
  `);

  const breakdown = res.rows.map((row: any) => ({
    productId: row.id,
    productName: row.name,
    sku: row.sku,
    quantity: Number(row.quantity_on_hand),
    price: Number(row.price),
    totalValue: Number(row.total_value),
    supplier: row.supplier ?? undefined,
  }));

  const totalValue = breakdown.reduce((sum, item) => sum + item.totalValue, 0);

  return { totalValue, breakdown };
}

export async function generateInventoryTurnoverReport(days: number = 30): Promise<InventoryTurnoverReport> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const res = await query(`
    WITH stock_changes AS (
      SELECT 
        product_id,
        kind,
        SUM(quantity) as total_quantity
      FROM stock_movements
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY product_id, kind
    ),
    beginning_stock AS (
      SELECT 
        p.id,
        COALESCE(SUM(CASE WHEN sm.created_at < $1 THEN 
          CASE WHEN sm.kind = 'sale' THEN -sm.quantity 
               WHEN sm.kind IN ('return', 'purchase') THEN sm.quantity 
               ELSE 0 END
        END), 0) as beginning_quantity
      FROM products p
      LEFT JOIN stock_movements sm ON p.id = sm.product_id
      GROUP BY p.id
    )
    SELECT 
      p.id,
      p.name,
      p.sku,
      COALESCE(bs.beginning_quantity, 0) as beginning_stock,
      COALESCE(sc_p.total_quantity, 0) as purchases,
      COALESCE(sc_s.total_quantity, 0) as sales,
      p.quantity_on_hand as ending_stock
    FROM products p
    LEFT JOIN beginning_stock bs ON p.id = bs.id
    LEFT JOIN stock_changes sc_p ON p.id = sc_p.product_id AND sc_p.kind = 'purchase'
    LEFT JOIN stock_changes sc_s ON p.id = sc_s.product_id AND sc_s.kind = 'sale'
    ORDER BY p.name
  `, [startDate.toISOString(), endDate.toISOString()]);

  const turnoverData = res.rows.map((row: any) => {
    const beginningStock = Number(row.beginning_stock);
    const purchases = Number(row.purchases);
    const sales = Number(row.sales);
    const endingStock = Number(row.ending_stock);
    
    // Calculate turnover rate: sales / average inventory
    const averageInventory = (beginningStock + endingStock) / 2;
    const turnoverRate = averageInventory > 0 ? sales / averageInventory : 0;

    return {
      productId: row.id,
      productName: row.name,
      sku: row.sku,
      beginningStock,
      purchases,
      sales,
      endingStock,
      turnoverRate: Math.round(turnoverRate * 100) / 100, // Round to 2 decimal places
    };
  });

  return {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    turnoverData,
  };
}

export function generateCSV(data: any[], filename: string): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}