import { Router } from 'express';
import {
  generateInventoryValueReport,
  generateInventoryTurnoverReport,
  generateCSV
} from '../reports';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Inventory Value Report
router.get('/inventory-value', async (_req, res) => {
  try {
    const report = await generateInventoryValueReport();
    res.json(report);
  } catch (err: any) {
    console.error('Error generating inventory value report:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// Inventory Value Report CSV Export
router.get('/inventory-value/csv', async (_req, res) => {
  try {
    const report = await generateInventoryValueReport();
    const csvData = report.breakdown.map(item => ({
      'Product Name': item.productName,
      'SKU': item.sku,
      'Quantity': item.quantity,
      'Price': item.price,
      'Total Value': item.totalValue,
      'Supplier': item.supplier || 'N/A',
    }));
    
    const csv = generateCSV(csvData, 'inventory-value');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-value.csv"');
    res.send(csv);
  } catch (err: any) {
    console.error('Error generating inventory value CSV:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// Inventory Turnover Report
router.get('/inventory-turnover', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR', 
        message: 'days must be a number between 1 and 365' 
      });
    }
    
    const report = await generateInventoryTurnoverReport(days);
    res.json(report);
  } catch (err: any) {
    console.error('Error generating inventory turnover report:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// Inventory Turnover Report CSV Export
router.get('/inventory-turnover/csv', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR', 
        message: 'days must be a number between 1 and 365' 
      });
    }
    
    const report = await generateInventoryTurnoverReport(days);
    const csvData = report.turnoverData.map(item => ({
      'Product Name': item.productName,
      'SKU': item.sku,
      'Beginning Stock': item.beginningStock,
      'Purchases': item.purchases,
      'Sales': item.sales,
      'Ending Stock': item.endingStock,
      'Turnover Rate': item.turnoverRate,
    }));
    
    const csv = generateCSV(csvData, `inventory-turnover-${days}-days`);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-turnover-${days}-days.csv"`);
    res.send(csv);
  } catch (err: any) {
    console.error('Error generating inventory turnover CSV:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;