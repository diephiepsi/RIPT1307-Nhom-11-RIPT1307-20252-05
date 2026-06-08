import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtUser } from '../types';

export function authOptional(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return next();
  const token = h.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? '') as JwtUser;
    req.user = payload;
  } catch {
    
  }
  next();
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = h.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? '') as JwtUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

