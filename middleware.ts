import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.pathname;
  const bypass = process.env.DEV_BYPASS_SUBSCRIPTION === 'true';

  // ✅ Define protected routes that require authentication
  const protectedPaths = ['/upload', '/history'];
  const isProtected = protectedPaths.some((path) => url.startsWith(path));
  const isApi = url.startsWith('/api');

  // ✅ Block access if not logged in
  if (!session && (isProtected || isApi)) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // ✅ Allow free trial users access to the interface
  // The question limit will be enforced in the API endpoints and frontend
  // No need to block access at the middleware level for free trial users
  
  return res;
}

export const config = {
  matcher: ['/upload', '/history', '/api/(.*)'],
};