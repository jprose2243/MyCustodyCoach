import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers/nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl.pathname;
  const bypass = process.env.DEV_BYPASS_SUBSCRIPTION === 'true';

  if (!session && url.startsWith('/upload')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!session && url.startsWith('/history')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!session && url.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ Check subscription status unless bypassing for local dev
  if (
    session &&
    !bypass &&
    (url.startsWith('/upload') || url.startsWith('/history') || url.startsWith('/api'))
  ) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('uid', session.user.id)
      .single();

    if (!profile?.subscription_status) {
      return NextResponse.redirect(new URL('/payment', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/upload', '/history', '/api/(.*)'],
};