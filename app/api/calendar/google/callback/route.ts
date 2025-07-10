import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains the userId
    const error = searchParams.get('error');

    if (error) {
      console.error('Google Calendar OAuth error:', error);
      return NextResponse.redirect(
        new URL('/parenting-time?error=google_auth_failed', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/parenting-time?error=missing_auth_params', request.url)
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange Google auth code for token');
      return NextResponse.redirect(
        new URL('/parenting-time?error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // TODO: Store tokens securely in database associated with userId (state)
    // For now, we'll just log success
    console.log('Google Calendar connected successfully for user:', state);
    console.log('Access token received (length):', tokens.access_token?.length);

    return NextResponse.redirect(
      new URL('/parenting-time?success=google_calendar_connected', request.url)
    );

  } catch (error) {
    console.error('Google Calendar callback error:', error);
    return NextResponse.redirect(
      new URL('/parenting-time?error=callback_error', request.url)
    );
  }
} 