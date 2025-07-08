import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any, // ✅ prevent TypeScript mismatch
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // ✅ Retrieve Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      console.error('❌ Payment not verified or session invalid:', session?.payment_status);
      return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
    }

    const userId = session.metadata?.userId;

    if (!userId || typeof userId !== 'string') {
      console.error('❌ Missing or invalid userId in Stripe metadata:', session.metadata);
      return NextResponse.json({ error: 'Missing userId in Stripe metadata' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ subscription_status: true })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Failed to update subscription status:', updateError.message);
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    console.log('✅ Subscription activated for user:', userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Payment verification error:', err.message || err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}