import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/lib/server-only/supabase-admin';
import { logError } from '@/src/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile to check current subscription status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('email, first_name, subscription_status')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    if (!profile.subscription_status) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Update subscription status to cancelled
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        subscription_status: false,
        subscription_cancelled_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update subscription status:', updateError);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    // Log the cancellation
    console.log('❌ Subscription cancelled:', {
      userId,
      email: profile.email,
      name: profile.first_name,
      timestamp: new Date().toISOString(),
    });

    // In a real implementation, you would:
    // 1. Cancel the subscription in Stripe
    // 2. Send a cancellation confirmation email
    // 3. Schedule access to end at the end of the billing period
    // 4. Potentially offer retention incentives

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription cancelled successfully' 
    });

  } catch (error) {
    console.error('Error in cancel-subscription endpoint:', error);
    logError(error as Error, { endpoint: '/api/cancel-subscription' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 