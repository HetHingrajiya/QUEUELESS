import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import * as jose from 'jose';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  role: string;
  organizationId?: string;
  officeId?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '1d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getUserFromCookie(): Promise<TokenPayload | null> {
  let token: string | undefined;

  try {
    const cookieStore = await cookies();
    token = cookieStore.get('token')?.value;
  } catch (_) {}

  if (!token) {
    try {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    } catch (_) {}
  }

  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload; // { userId, role, organizationId, officeId }
  } catch (error) {
    return null;
  }
}
