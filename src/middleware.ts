import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminApi = pathname.startsWith('/api/admin');
  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminApi || isAdminPage) {
    const secret = process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== 'production' ? 'local-dev-only-secret-key-replace-in-production-min-32-chars' : undefined);

    if (!secret) {
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, error: 'Server configuration error: NEXTAUTH_SECRET is required.' },
          { status: 500 }
        );
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'ConfigurationError');
      return NextResponse.redirect(loginUrl);
    }

    const token = await getToken({ req, secret });

    // Handle API routes protection (Return 401 / 403 JSON)
    if (isAdminApi) {
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Authentication required to access admin endpoints.' },
          { status: 401 }
        );
      }

      const role = (token.role as string)?.toUpperCase();
      if (role !== 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden: Insufficient privileges. ADMIN role required.',
            currentRole: role || 'UNKNOWN',
          },
          { status: 403 }
        );
      }

      return NextResponse.next();
    }

    // Handle Page routes protection (Redirect to /login)
    if (isAdminPage) {
      if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const role = (token.role as string)?.toUpperCase();
      if (role !== 'ADMIN') {
        const forbiddenUrl = new URL('/login', req.url);
        forbiddenUrl.searchParams.set('error', 'AccessDenied');
        forbiddenUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(forbiddenUrl);
      }

      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
