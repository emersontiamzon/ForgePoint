//import { Router } from 'express';
//import { createUser, findUserByEmail, validatePassword, generateAuthTokens, refreshAccessToken as refreshAuthToken, revokeRefreshToken } from '../models/user';
import { AuthenticatedRequest } from '../middleware/auth';
import { query } from '../db';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}
 
const express = require('express');
const {
  createUser,
  findUserByEmail,
  validatePassword,
  generateAuthTokens,
  refreshAccessToken: refreshAuthToken,
  revokeRefreshToken
} =  require('../models/user');
const router = express.Router();
// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Create user
    const user = await createUser(email, password, name);
    
    // Generate tokens
    const tokens = await generateAuthTokens(user);
    
    res.status(201).json(tokens);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await validatePassword(user, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = await generateAuthTokens(user);
    
    res.json(tokens);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh access token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const tokens = await refreshAuthToken(refreshToken);
    if (!tokens) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
    
    res.json(tokens);
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (revoke refresh token)
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    await revokeRefreshToken(refreshToken);
    res.json({ message: 'Successfully logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't return password hash
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to find user by ID (for token validation)
async function findUserById(id: string) {
  const res = await query<UserRow>('SELECT id, email, password_hash FROM users WHERE id = $1', [id]);
  if (res.rowCount === 0) return null;
  return {
    id: res.rows[0].id,
    email: res.rows[0].email,
    passwordHash: res.rows[0].password_hash,
  };
}

export default router;
