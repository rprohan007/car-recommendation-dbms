import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAppEnv } from '@/lib/env';

export interface AuthContext {
  userId: number;
  email: string;
  role: string;
}

/**
 * Retrieves the authenticated user token on the server side using NextAuth JWT.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthContext | null> {
  try {
    const env = getAppEnv();
    const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });
    if (!token || !token.email) return null;

    return {
      userId: Number(token.userId || token.sub) || 0,
      email: (token.email as string).toLowerCase(),
      role: ((token.role as string) || 'CUSTOMER').toUpperCase(),
    };
  } catch (err) {
    console.error('[SECURITY] Error reading authentication token:', err);
    return null;
  }
}

/**
 * Server-side guard to strictly enforce ADMIN role authorization on API endpoints.
 * Returns null if authorized, or a 401/403 NextResponse if unauthorized.
 */
export async function requireAdmin(req: NextRequest): Promise<{ user: AuthContext | null; errorResponse: NextResponse | null }> {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (user.role !== 'ADMIN') {
    return {
      user,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Insufficient privileges. ADMIN role required.',
          currentRole: user.role,
        },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}
