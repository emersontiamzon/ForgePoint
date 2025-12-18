import { Router } from 'express';
import { adjustStock } from '../products';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

function parseQuantity(raw: any): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('INVALID_QUANTITY');
  }
  return n;
}

router.post('/sale', async (req, res) => {
  const { productId, quantity } = req.body ?? {};
  try {
    const qty = parseQuantity(quantity);
    const updated = await adjustStock(productId, -qty, 'sale');
    if (!updated) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    return res.json(updated);
  } catch (err: any) {
    if (err?.message === 'INVALID_QUANTITY') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'quantity must be > 0' });
    }
    if (err?.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ error: 'INSUFFICIENT_STOCK' });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/return', async (req, res) => {
  const { productId, quantity } = req.body ?? {};
  try {
    const qty = parseQuantity(quantity);
    const updated = await adjustStock(productId, qty, 'return');
    if (!updated) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    return res.json(updated);
  } catch (err: any) {
    if (err?.message === 'INVALID_QUANTITY') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'quantity must be > 0' });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/purchase', async (req, res) => {
  const { productId, quantity } = req.body ?? {};
  try {
    const qty = parseQuantity(quantity);
    const updated = await adjustStock(productId, qty, 'purchase');
    if (!updated) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    return res.json(updated);
  } catch (err: any) {
    if (err?.message === 'INVALID_QUANTITY') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'quantity must be > 0' });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
