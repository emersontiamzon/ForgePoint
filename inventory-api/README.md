# ForgePoint Inventory API

RESTful API service for the ForgePoint Inventory Management System, built with Node.js, Express, and TypeScript.

## Features

-  JWT Authentication
-  Product Management
-  Stock Level Monitoring
-  Stock Movement Tracking
-  Low Stock Alerts
-  Role-based Access Control

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express
- **Database**: PostgreSQL
- **ORM**: node-postgres (pg)
- **Authentication**: JWT
- **Validation**: Express Validator
- **Testing**: Jest, Supertest
- **Linting**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later
- npm 9+ or yarn 1.22+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/forgepoint.git
   cd forgepoint/inventory-api
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Update .env with your database credentials
   ```

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:password@localhost:5432/forgepoint_db

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=your_smtp_password
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Products

- `GET /api/products` - List all products
- `POST /api/products` - Create a new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/adjust-stock` - Adjust product stock

### Stock Movements

- `GET /api/stock-movements` - List all stock movements
- `GET /api/stock-movements/:productId` - Get stock movements for a product

### Alerts

- `GET /api/alerts/low-stock` - Get low stock alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge an alert

## Development

### Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run lint` - Lint code
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Database Migrations

To create a new migration:

```bash
npm run create-migration --name=add_new_table
```

To run migrations:

```bash
npm run migrate
```

## Testing

Run the test suite:

```bash
npm test
```

## Security

- All API routes (except auth) are protected with JWT authentication
- Input validation is implemented using express-validator
- Passwords are hashed using bcrypt
- CORS is enabled with appropriate configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
