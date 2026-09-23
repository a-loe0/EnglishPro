import { describe, expect, it } from 'vitest';
import { verifyAccessToken } from '../src/jwt';
import { signToken, studentClaims } from './helpers';

const SECRET = 'test-secret';

describe('verifyAccessToken', () => {
  it('accepts a valid backend token', async () => {
    const token = await signToken(studentClaims(), SECRET);
    const payload = await verifyAccessToken(token, SECRET);
    expect(payload).toMatchObject({ userId: 'student-1', role: 'STUDENT' });
  });

  it('rejects a token signed with another secret', async () => {
    const token = await signToken(studentClaims(), 'other-secret');
    expect(await verifyAccessToken(token, SECRET)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await signToken(studentClaims({ exp: 1000 }), SECRET);
    expect(await verifyAccessToken(token, SECRET)).toBeNull();
  });

  it('rejects a token whose payload was altered', async () => {
    const token = await signToken(studentClaims(), SECRET);
    const [header, , signature] = token.split('.');
    const forged = btoa(JSON.stringify(studentClaims({ userId: 'someone-else' })))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(await verifyAccessToken(`${header}.${forged}.${signature}`, SECRET)).toBeNull();
  });

  it('rejects alg "none" and other algorithms', async () => {
    const token = await signToken(studentClaims(), SECRET, { alg: 'none', typ: 'JWT' });
    expect(await verifyAccessToken(token, SECRET)).toBeNull();
  });

  it('rejects tokens missing backend claims', async () => {
    const token = await signToken({ exp: Math.floor(Date.now() / 1000) + 60 }, SECRET);
    expect(await verifyAccessToken(token, SECRET)).toBeNull();
  });

  it('rejects malformed tokens', async () => {
    expect(await verifyAccessToken('not-a-token', SECRET)).toBeNull();
    expect(await verifyAccessToken('a.b.c', SECRET)).toBeNull();
  });
});
