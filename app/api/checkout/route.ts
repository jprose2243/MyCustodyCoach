import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
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

    // ✅ Grab user info from request body
    const { userId, email } = await req.json();

    if (!userId || !email) {
      console.error('❌ Missing userId or email in request body:', { userId, email });
      return NextResponse.json(
        { error: 'Missing user information' },
        { status: 400 }
      );
    }

    // ✅ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      metadata: {
        userId, // 👈 passed into verify-payment route
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
  } catch (err: any) {
    console.error('❌ Stripe session error:', err.message || err);
    return NextResponse.json(
      { error: 'Internal error creating Stripe session' },
      { status: 500 }
    );
  }
}