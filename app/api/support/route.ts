import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/src/utils/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Log the support request
    console.log('📞 Support request received:', {
      name,
      email,
      subject,
      message: message.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
    });

    // In a real implementation, you would:
    // 1. Send an email to your support team
    // 2. Create a ticket in your support system
    // 3. Send an auto-reply to the user
    
    // For now, we'll just log it and return success
    // You can integrate with services like SendGrid, Mailgun, or Zendesk

    return NextResponse.json({ 
      success: true, 
      message: 'Support request received successfully' 
    });

  } catch (error) {
    console.error('Error in support endpoint:', error);
    logError(error as Error, { endpoint: '/api/support' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 