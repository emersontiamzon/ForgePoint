import { query } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1d';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password_hash'>;
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = randomUUID();
  const now = new Date().toISOString();
  
  const result = await query<User>(
    `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, email, hashedPassword, name, now, now]
  );

  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

export async function validatePassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

export async function generateAuthTokens(user: User): Promise<AuthTokens> {
  // Generate access token
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Generate refresh token
  const refreshToken = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Store refresh token in database
  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, refreshToken, expiresAt]
  );

  // Return tokens and user info (without password)
  const { password_hash, ...userWithoutPassword } = user;
  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
  // Find the refresh token in the database
  const tokenResult = await query<{user_id: string, expires_at: Date}>(
    `DELETE FROM refresh_tokens 
     WHERE token = $1 
     RETURNING user_id, expires_at`,
    [refreshToken]
  );

  if (tokenResult.rows.length === 0) {
    return null; // Invalid refresh token
  }

  const { user_id, expires_at } = tokenResult.rows[0];
  
  // Check if token is expired
  if (new Date(expires_at) < new Date()) {
    return null; // Token expired
  }

  // Get user
  const userResult = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [user_id]
  );

  if (userResult.rows.length === 0) {
    return null; // User not found
  }

  // Generate new tokens
  return generateAuthTokens(userResult.rows[0]);
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await query(
    'DELETE FROM refresh_tokens WHERE token = $1',
    [refreshToken]
  );
}

export async function findUserById(id: string): Promise<User | undefined> {
  const result = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}
