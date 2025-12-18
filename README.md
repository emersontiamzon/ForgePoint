# ForgePoint Inventory Management System

## Overview
ForgePoint is a comprehensive inventory management system designed to help businesses track, manage, and optimize their inventory operations. The system consists of a modern web application and a robust backend API.

## Project Structure

```
ForgePoint/
├── inventory-api/         # Backend API service (Node.js/TypeScript)
└── README.md             # This file
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+ or yarn 1.22+

### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/forgepoint.git
   cd forgepoint
   ```

2. Set up the backend API:
   ```bash
   cd inventory-api
   npm install
   cp .env.example .env
   # Update .env with your database credentials
   npm run migrate
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root of each service with the following variables:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/forgepoint_db

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run lint` - Lint code
- `npm test` - Run tests

## API Documentation

API documentation is available at `/api-docs` when running the development server.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
