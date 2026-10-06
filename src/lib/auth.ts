import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface TokenPayload {
  userId: string;
  role: string;
  organizationId?: string;
  officeId?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getUserFromCookie(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload; // { userId, role, organizationId, officeId }
  } catch (error) {
    return null;
  }
}
