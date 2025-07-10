import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = req.nextUrl.pathname;

  // ✅ Define protected routes that require authentication
  const protectedPaths = [
    '/upload', 
    '/history', 
    '/evidence', 
    '/parenting-time', 
    '/settings'
  ];
  const isProtected = protectedPaths.some((path) => url.startsWith(path));
  const isApi = url.startsWith('/api');

  // ✅ Block access if not logged in
  if (!user && (isProtected || isApi)) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // ✅ Allow free trial users access to the interface
  // The question limit will be enforced in the API endpoints and frontend
  // No need to block access at the middleware level for free trial users
  
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/upload', 
    '/history', 
    '/evidence/:path*', 
    '/parenting-time', 
    '/settings',
    '/api/:path*'
  ],
};