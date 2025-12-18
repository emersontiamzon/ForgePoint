import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  listStockMovements,
  updateProduct,
  getLowStockAlerts,
  acknowledgeLowStockAlert,
  getProductLowStockThreshold,
  setProductLowStockThreshold
} from '../products';
import { Product } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await listProducts();
  res.json({ items });
});

router.get('/:id', async (req, res) => {
  const product = await getProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  return res.json(product);
});

router.get('/:id/movements', async (req, res) => {
  const product = await getProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  const movements = await listStockMovements(req.params.id);
  return res.json({ items: movements });
});

router.post('/', async (req, res) => {
  const body = req.body ?? {};
  try {
    const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      description: body.description,
      sku: body.sku,
      price: Number(body.price ?? 0),
      quantityOnHand: Number(body.quantityOnHand ?? 0),
      lowStockThreshold: body.lowStockThreshold ? Number(body.lowStockThreshold) : undefined,
      supplier: body.supplier,
      location: body.location,
      createdAt: '',
      updatedAt: '',
    } as any;

    if (!payload.name || !payload.sku) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'name and sku are required' });
    }

    const product = await createProduct(payload);
    return res.status(201).json(product);
  } catch (err: any) {
    if (err?.message === 'SKU_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'SKU_ALREADY_EXISTS' });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.put('/:id', async (req, res) => {
  const body = req.body ?? {};
  try {
    const updated = await updateProduct(req.params.id, body);
    if (!updated) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    return res.json(updated);
  } catch (err: any) {
    if (err?.message === 'SKU_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'SKU_ALREADY_EXISTS' });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.delete('/:id', async (req, res) => {
  const deleted = await deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  return res.status(204).send();
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Low stock alerts endpoints
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const alerts = await getLowStockAlerts();
    res.json({ items: alerts });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/alerts/low-stock/:alertId/acknowledge', async (req, res) => {
  const { alertId } = req.params;
  const { userId } = req.body ?? {};
  
  try {
    const success = await acknowledgeLowStockAlert(alertId, userId);
    if (!success) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// Product threshold endpoints
router.get('/:id/low-stock-threshold', async (req, res) => {
  const { id } = req.params;
  
  try {
    const threshold = await getProductLowStockThreshold(id);
    if (threshold === undefined) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    return res.json({ threshold });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.put('/:id/low-stock-threshold', async (req, res) => {
  const { id } = req.params;
  const { threshold } = req.body ?? {};
  
  if (!Number.isInteger(threshold) || threshold < 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'threshold must be a non-negative integer' });
  }
  
  try {
    const success = await setProductLowStockThreshold(id, threshold);
    if (!success) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    return res.json({ threshold });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
