import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as Stripe.LatestApiVersion, // ✅ Cast to silence TS warning
});

export async function POST(req: Request) {
  try {
    const priceId = process.env.STRIPE_PRICE_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!priceId || !siteUrl) {
      console.error('❌ Missing env vars:', { priceId, siteUrl });
      return NextResponse.json(
        { error: 'Missing Stripe config' },
        { status: 500 }
      );
    }

    const { userId, email } = await req.json();

    if (!userId || !email) {
      console.error('❌ Missing userId or email in request body:', { userId, email });
      return NextResponse.json(
        { error: 'Missing user information' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      metadata: {
        userId, // Used in verify-payment
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment/cancelled`,
    });

    if (!session?.url) {
      console.error('❌ Stripe session created but no URL');
      return NextResponse.json(
        { error: 'Stripe session did not return a URL' },
        { status: 500 }
      );
    }

    console.log('✅ Stripe session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('❌ Stripe session error:', errorMessage);
    return NextResponse.json(
      { error: 'Internal error creating Stripe session' },
      { status: 500 }
    );
  }
}