import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      email,
      first_name,
      court_state,
      child_age,
      children_count,
      parent_role,
      goal_priority,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const parsedAge = Number(child_age);
    if (isNaN(parsedAge) || parsedAge < 0) {
      return NextResponse.json({ error: 'Invalid child age' }, { status: 400 });
    }

    const insertPayload = {
      id: userId,
      email: email?.trim() || '',
      first_name: first_name?.trim() || '',
      court_state: court_state?.trim() || '',
      child_age: parsedAge,
      children_count: children_count?.trim() || '1',
      parent_role: parent_role?.trim() || '',
      goal_priority: goal_priority?.trim() || '',
      questions_used: 0,
      subscription_status: false,
    };

    console.log('📥 Profile insert payload:', insertPayload);

    // 🔍 Check if user already exists
    const { data: existing, error: existsError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existsError && existsError.code !== 'PGRST116') {
      console.error('❌ Select error:', existsError.message);
      return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(insertPayload);

      if (insertError) {
        console.error('❌ Insert error (full):', JSON.stringify(insertError, null, 2));
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      return NextResponse.json({ success: true, created: true });
    }

    // 🛠 Update profile if it already exists
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(insertPayload)
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Update error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: true });
  } catch (err: any) {
    console.error('❌ Unexpected error in init-user-profile:', err.message || err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}