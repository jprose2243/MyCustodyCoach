import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // ✅ Retrieve Stripe session and check payment status
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      console.error('❌ Payment not verified or session invalid:', session?.payment_status);
      return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
    }

    // ✅ Extract user ID from Stripe metadata
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error('❌ Missing userId in Stripe metadata');
      return NextResponse.json({ error: 'Missing userId in Stripe metadata' }, { status: 400 });
    }

    // ✅ Update subscription_status in Supabase
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ subscription_status: true })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Failed to update subscription status:', updateError);
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Payment verification error:', err.message || err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}