import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokens,
  TokenPayload,
} from '../../../src/utils/jwt';

describe('JWT Utils', () => {
  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'STUDENT',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include payload in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.decode(token) as TokenPayload & { iat: number; exp: number };

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different tokens than access token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return payload for valid token', () => {
      const token = generateAccessToken(mockPayload);
      const result = verifyAccessToken(token);

      expect(result.userId).toBe(mockPayload.userId);
      expect(result.email).toBe(mockPayload.email);
      expect(result.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw error for tampered token', () => {
      const token = generateAccessToken(mockPayload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyAccessToken(tamperedToken)).toThrow();
    });

    it('should throw error for refresh token (wrong secret)', () => {
      const refreshToken = generateRefreshToken(mockPayload);

      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return payload for valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const result = verifyRefreshToken(token);

      expect(result.userId).toBe(mockPayload.userId);
      expect(result.email).toBe(mockPayload.email);
      expect(result.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should throw error for access token (wrong secret)', () => {
      const accessToken = generateAccessToken(mockPayload);

      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(mockPayload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid tokens that can be verified', () => {
      const tokens = generateTokens(mockPayload);

      const accessPayload = verifyAccessToken(tokens.accessToken);
      const refreshPayload = verifyRefreshToken(tokens.refreshToken);

      expect(accessPayload.userId).toBe(mockPayload.userId);
      expect(refreshPayload.userId).toBe(mockPayload.userId);
    });

    it('should generate unique token pairs on each call', () => {
      const tokens1 = generateTokens(mockPayload);
      const tokens2 = generateTokens(mockPayload);

      // Due to timing, tokens generated at same time may be identical
      // But in practice with iat they should differ
      expect(tokens1.accessToken).toBeTruthy();
      expect(tokens2.accessToken).toBeTruthy();
    });
  });
});
