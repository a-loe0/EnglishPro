// Verifies the backend's access tokens (jsonwebtoken, HS256 with JWT_SECRET)
// using Web Crypto, so the Worker needs no Node JWT library.

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

const encoder = new TextEncoder();

function base64UrlDecode(segment: string): Uint8Array {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(segment: string): unknown {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(segment)));
}

/**
 * Returns the token's payload, or null when the token is malformed, not
 * HS256, signed with another key, expired, or missing the backend's claims.
 */
export async function verifyAccessToken(
  token: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<AccessTokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  let header: unknown;
  let payload: unknown;
  let signature: Uint8Array;
  try {
    header = decodeJson(headerPart);
    payload = decodeJson(payloadPart);
    signature = base64UrlDecode(signaturePart);
  } catch {
    return null;
  }

  // Pin the algorithm: never let the token choose (e.g. "none").
  if (typeof header !== 'object' || header === null || (header as { alg?: unknown }).alg !== 'HS256') {
    return null;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    encoder.encode(`${headerPart}.${payloadPart}`),
  );
  if (!valid) return null;

  if (typeof payload !== 'object' || payload === null) return null;
  const claims = payload as Record<string, unknown>;
  if (
    typeof claims.userId !== 'string' ||
    typeof claims.email !== 'string' ||
    typeof claims.role !== 'string' ||
    typeof claims.exp !== 'number'
  ) {
    return null;
  }
  if (claims.exp <= nowSeconds) return null;

  return {
    userId: claims.userId,
    email: claims.email,
    role: claims.role,
    exp: claims.exp,
  };
}
