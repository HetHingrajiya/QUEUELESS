import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define the paths that require super admin role
const SUPER_ADMIN_PATHS = ['/super-admin'];
const SUPER_ADMIN_API_PATHS = ['/api/super-admin', '/api/organizations', '/api/offices', '/api/services', '/api/counters', '/api/staff', '/api/admins', '/api/roles', '/api/permissions', '/api/priority-rules', '/api/audit-logs', '/api/system-settings', '/api/notifications', '/api/reports'];

// This should match the secret in lib/auth.ts
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a protected path
  const isSuperAdminPath = SUPER_ADMIN_PATHS.some(path => pathname.startsWith(path));
  const isSuperAdminApi = SUPER_ADMIN_API_PATHS.some(path => pathname.startsWith(path));

  if (!isSuperAdminPath && !isSuperAdminApi) {
    return NextResponse.next();
  }

  // Exempt auth routes if any happen to fall under these paths (e.g. login)
  if (pathname.includes('/auth/login')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (isSuperAdminApi) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    
    // Check role for Super Admin paths
    if (isSuperAdminPath || isSuperAdminApi) {
      if (payload.role !== 'SUPER_ADMIN') {
        if (isSuperAdminApi) {
          return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Pass user info in headers for the API to consume easily
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-role', payload.role as string);
    if (payload.organizationId) {
      requestHeaders.set('x-user-org-id', payload.organizationId as string);
    }
    if (payload.officeId) {
      requestHeaders.set('x-user-office-id', payload.officeId as string);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (isSuperAdminApi) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    // Clear invalid cookie
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/api/:path*',
  ],
};
