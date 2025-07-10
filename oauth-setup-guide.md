# OAuth Setup Guide for MyCustodyCoach Calendar Integration

## 🔧 Complete Setup Instructions

### Step 1: Add to .env.local File

Add these variables to your `.env.local` file:

```bash
# Google Calendar Integration
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-YourGoogleClientSecret

# Microsoft Graph Integration  
MICROSOFT_GRAPH_CLIENT_ID=your_microsoft_client_id
MICROSOFT_GRAPH_CLIENT_SECRET=YourMicrosoftClientSecret

# Base URL for OAuth callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Step 2: Google Calendar OAuth Setup

#### 2.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "MyCustodyCoach Calendar Sync"
4. Click "Create"

#### 2.2 Enable Google Calendar API
1. Navigate to "APIs & Services" → "Library"
2. Search "Google Calendar API"
3. Click "Enable"

#### 2.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (for testing)
3. Fill required fields:
   - App name: "MyCustodyCoach"
   - User support email: your email
   - Developer contact: your email
4. Add scope: `https://www.googleapis.com/auth/calendar`
5. Add test users (your email)

#### 2.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/calendar/google/callback`
   - Production: `https://yourdomain.com/api/calendar/google/callback`
5. Copy Client ID and Client Secret to `.env.local`

### Step 3: Microsoft Graph OAuth Setup

#### 3.1 Register Azure Application
1. Go to [Azure Portal](https://portal.azure.com/)
2. Search "Azure Active Directory"
3. "App registrations" → "New registration"
4. Configure:
   - Name: "MyCustodyCoach Calendar Sync"
   - Account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `http://localhost:3000/api/calendar/microsoft/callback`

#### 3.2 Create Client Secret
1. Go to "Certificates & secrets"
2. "New client secret"
3. Description: "MyCustodyCoach Calendar Access"
4. Copy the secret VALUE immediately

#### 3.3 Configure API Permissions
1. Go to "API permissions"
2. "Add a permission" → "Microsoft Graph" → "Delegated permissions"
3. Add permissions:
   - `Calendars.ReadWrite`
   - `offline_access`
4. "Grant admin consent" if required

### Step 4: Test OAuth Integration

#### 4.1 Start Development Server
```bash
npm run dev
```

#### 4.2 Test Google Calendar
1. Navigate to `http://localhost:3000/parenting-time`
2. Click "🔄 Sync Calendars"
3. Click "Connect" for Google Calendar
4. You should be redirected to Google's OAuth page
5. After authorization, you'll be redirected back with success message

#### 4.3 Test Microsoft Calendar
1. In the Calendar Sync modal
2. Click "Connect" for Outlook Calendar
3. You should be redirected to Microsoft's OAuth page
4. After authorization, you'll be redirected back with success message

### Step 5: Production Configuration

#### 5.1 Update Redirect URIs
- Google: Add `https://yourdomain.com/api/calendar/google/callback`
- Microsoft: Add `https://yourdomain.com/api/calendar/microsoft/callback`

#### 5.2 Update Environment Variables
```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

#### 5.3 Domain Verification
- Google: Verify domain ownership in Google Console
- Microsoft: Add domain to Azure app registration

## 🔒 Security Best Practices

### Token Storage
- Store access tokens encrypted in database
- Implement token refresh mechanisms
- Set appropriate token expiration times

### Environment Security
- Never commit `.env.local` to version control
- Use secure environment variable management in production
- Rotate secrets regularly

### OAuth Validation
- Validate all OAuth callback parameters
- Implement CSRF protection with state parameter
- Use HTTPS in production

## 🧪 Testing Checklist

- [ ] Google OAuth flow completes successfully
- [ ] Microsoft OAuth flow completes successfully  
- [ ] Tokens are received and can be stored
- [ ] Error handling works for failed authentications
- [ ] Redirect URIs work for both development and production
- [ ] Calendar API calls work with received tokens

## 🚨 Troubleshooting

### Common Issues

**"redirect_uri_mismatch" Error**
- Ensure redirect URI in OAuth app matches exactly
- Check for trailing slashes or case differences
- Verify NEXT_PUBLIC_BASE_URL is correct

**"invalid_client" Error**
- Double-check Client ID and Client Secret
- Ensure credentials are copied correctly
- Check for extra spaces or characters

**"unauthorized_client" Error**
- Verify OAuth consent screen is configured
- Add your email as test user for Google
- Grant admin consent for Microsoft Graph permissions

**"scope_not_found" Error**
- Ensure required scopes are added to OAuth app
- For Google: `https://www.googleapis.com/auth/calendar`
- For Microsoft: `Calendars.ReadWrite`

### Getting Help

1. Check browser console for JavaScript errors
2. Check server logs for OAuth callback errors
3. Verify environment variables are loaded correctly
4. Test OAuth URLs manually in browser
5. Use OAuth playground tools for debugging

## 📝 Next Steps

After OAuth setup is complete:
1. Implement token storage in database
2. Add token refresh logic
3. Build calendar sync functionality
4. Add error handling and user feedback
5. Test with real calendar data
6. Deploy to production with HTTPS 