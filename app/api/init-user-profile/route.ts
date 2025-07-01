import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json();
    const { id: userId } = user;

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const { error } = await supabase.from('user_profiles').insert([
      {
        id: userId,
        questions_used: 0,
        subscribed: false,
      },
    ]);

    if (error && !error.message.includes('duplicate')) {
      console.error('❌ Supabase insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ init-user-profile error:', err.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}