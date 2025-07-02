import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers/nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 🔐 Client route protection
  if (!session && req.nextUrl.pathname.startsWith('/upload')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!session && req.nextUrl.pathname.startsWith('/history')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/upload',
    '/history',
    '/api/(.*)', // ✅ wildcard match for all protected API routes
  ],
};