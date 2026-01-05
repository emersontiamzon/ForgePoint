const express = require('express');
const cors = require('cors');

 const dotenv = require('dotenv');
 dotenv.config();

// Helper function to handle both CommonJS and ES module imports
function requireRoute(modulePath) {
  const module = require(modulePath);
  return module.default || module;
}

const productsRouter = requireRoute('./routes/products');
const inventoryRouter = requireRoute('./routes/inventory');
const reportsRouter = requireRoute('./routes/reports');
const authRouter = requireRoute('./routes/auth');
const { initDb } = require('./db');

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
      const migrate = require('./utils/migrate');
      await migrate.runMigrations();
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
