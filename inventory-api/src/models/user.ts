const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '1d';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

async function createUser(email, password, name) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = randomUUID();
  const now = new Date().toISOString();

  const result = await db.query(
      `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
      [userId, email, hashedPassword, name, now, now]
  );

  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
  );
  return result.rows[0];
}

async function validatePassword(user, password) {
  if (!user || !user.password_hash) return false;
  return bcrypt.compare(password, user.password_hash);
}

async function generateAuthTokens(user) {
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
  await db.query(
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

async function refreshAccessToken(refreshToken) {
  // Find the refresh token in the database
  const tokenResult = await db.query(
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
  const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [user_id]
  );

  if (userResult.rows.length === 0) {
    return null; // User not found
  }

  // Generate new tokens
  return generateAuthTokens(userResult.rows[0]);
}

async function revokeRefreshToken(refreshToken) {
  await db.query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [refreshToken]
  );
}

async function findUserById(id) {
  const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  validatePassword,
  generateAuthTokens,
  refreshAccessToken,
  revokeRefreshToken,
  findUserById
};