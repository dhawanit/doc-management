import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionToken: user.sessionToken,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      sessionToken: user.sessionToken,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateSessionToken() {
  return crypto.randomUUID();
}