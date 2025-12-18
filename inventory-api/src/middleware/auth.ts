import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    // Verify user still exists
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // For now, we'll just check if the user is authenticated
    // You can extend this to check for specific roles if needed
    if (!req.user) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    next();
  };
}
