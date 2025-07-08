import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  const { access_token } = await request.json();

  if (!access_token) {
    return NextResponse.json({ error: 'Missing access or refresh token' }, { status: 400 });
  }

  const cookieStore = await cookies(); // ✅ must be awaited now

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token: access_token,
  });

  if (error) {
    console.error('❌ Supabase setSession error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Session set successfully', user: data.user });
}