import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products';
import inventoryRouter from './routes/inventory';
import reportsRouter from './routes/reports';
import authRouter from './routes/auth';
import { initDb } from './db';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'inventory-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/reports', reportsRouter);


async function startServer() {
  try {
    // Initialize database and run migrations
    await initDb();
    if (process.env.NODE_ENV !== 'test') {
      // Only run migrations in non-test environment
      const { runMigrations } = await import('./utils/migrate');
      await runMigrations();
    }
    
    console.log('Database initialized and migrations applied');
    
    app.listen(port, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`inventory-api listening on port ${port}`);
      console.log(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
