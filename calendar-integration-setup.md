# Calendar Integration Setup

This document outlines how to set up external calendar integration for MyCustodyCoach.

## Overview

The calendar sync feature allows users to synchronize their parenting time entries with:
- **Google Calendar** - Using Google Calendar API
- **Microsoft Outlook** - Using Microsoft Graph API  
- **Apple Calendar** - Using CalDAV protocol (future)

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Google Calendar Integration
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret

# Microsoft Graph Integration
MICROSOFT_GRAPH_CLIENT_ID=your_microsoft_client_id
MICROSOFT_GRAPH_CLIENT_SECRET=your_microsoft_client_secret

# Base URL for OAuth callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Google Calendar Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Calendar API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add redirect URI: `http://localhost:3000/api/calendar/google/callback`
   - Note the Client ID and Client Secret

4. **Configure OAuth Consent Screen**
   - Add required information
   - Add test users during development
   - Request scopes: `https://www.googleapis.com/auth/calendar`

## Microsoft Graph Setup

1. **Register Application**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"

2. **Configure Application**
   - Set redirect URI: `http://localhost:3000/api/calendar/microsoft/callback`
   - Note the Application (client) ID

3. **Create Client Secret**
   - Go to "Certificates & secrets"
   - Create new client secret
   - Note the secret value

4. **Set API Permissions**
   - Go to "API permissions"
   - Add permission for "Microsoft Graph"
   - Add `Calendars.ReadWrite` scope

## Apple Calendar (CalDAV)

Apple Calendar integration uses the CalDAV protocol and doesn't require OAuth setup. Users provide their iCloud credentials directly through the app interface.

## Security Considerations

- Store access tokens securely in database with encryption
- Implement token refresh mechanisms
- Use HTTPS in production
- Validate all OAuth callbacks
- Implement rate limiting
- Add proper error handling and logging

## Database Schema

You'll need to add calendar sync settings to your database:

```sql
-- Calendar sync settings table
CREATE TABLE calendar_sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'apple'
  enabled BOOLEAN DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  calendar_id TEXT,
  sync_direction VARCHAR(20) DEFAULT 'export', -- 'import', 'export', 'bidirectional'
  privacy_settings JSONB DEFAULT '{}',
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can manage their own calendar sync settings" ON calendar_sync_settings
  USING (auth.uid() = user_id);
```

## Privacy Features

The calendar sync includes privacy controls:

- **Generic Titles**: Use "Parenting Time" instead of specific entry types
- **Child Name Control**: Option to include/exclude child names
- **Location Control**: Option to include/exclude location information  
- **Notes Control**: Option to include/exclude detailed notes
- **Sync Direction**: Choose import, export, or bidirectional sync

## Development Status

Currently implemented:
- ✅ Calendar sync service architecture
- ✅ UI interface for calendar management
- ✅ OAuth callback endpoints
- ✅ Privacy controls interface

Still needed for full implementation:
- 🔄 Database schema for sync settings
- 🔄 Token storage and refresh logic
- 🔄 Actual API calls to Google Calendar
- 🔄 Actual API calls to Microsoft Graph
- 🔄 CalDAV implementation for Apple Calendar
- 🔄 Bidirectional sync engine
- 🔄 Conflict resolution
- 🔄 Automated sync scheduling

## Testing

To test the calendar integration:

1. Set up OAuth credentials as described above
2. Add environment variables to `.env.local`
3. Start the development server
4. Navigate to parenting-time page
5. Click "🔄 Sync Calendars" button
6. Test the OAuth flow for each provider

## Production Deployment

For production:
- Use HTTPS URLs for all OAuth callbacks
- Set up proper domain verification
- Configure production OAuth credentials
- Implement secure token storage
- Add monitoring and logging
- Set up automated sync jobs 