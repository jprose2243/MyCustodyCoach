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

  // ✅ Define protected routes
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

  // ✅ Enforce subscription unless bypass is active
  if (session && !bypass && (isProtected || isApi)) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('❌ Failed to fetch user profile in middleware:', error.message);
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (!profile?.subscription_status) {
      console.log('⛔ Blocked non-subscriber access to:', url);
      return NextResponse.redirect(new URL('/payment', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/upload', '/history', '/api/(.*)'],
};