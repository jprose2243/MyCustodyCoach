import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!, // from your Stripe product
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('❌ Stripe session error:', err.message);
    return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 });
  }
}