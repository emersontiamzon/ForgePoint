declare namespace NodeJS {
  export interface ProcessEnv {
    // Server
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    
    // Database
    DATABASE_URL: string;
    
    // JWT
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    
    // CORS
    FRONTEND_URL: string;
  }
}
