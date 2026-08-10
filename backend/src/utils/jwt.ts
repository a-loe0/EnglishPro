import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'fallback-reset-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_RESET_EXPIRES_IN = '1h'; // Reset tokens expire in 1 hour

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}

export function generateTokens(payload: TokenPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export interface ResetTokenPayload {
  userId: string;
  email: string;
  type: 'reset';
}

export function generateResetToken(userId: string, email: string): string {
  const payload: ResetTokenPayload = { userId, email, type: 'reset' };
  return jwt.sign(payload, JWT_RESET_SECRET, { expiresIn: JWT_RESET_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyResetToken(token: string): ResetTokenPayload {
  const payload = jwt.verify(token, JWT_RESET_SECRET) as ResetTokenPayload;
  if (payload.type !== 'reset') {
    throw new Error('Invalid token type');
  }
  return payload;
}
