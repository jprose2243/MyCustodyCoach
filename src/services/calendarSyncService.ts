// Calendar Sync Service for MyCustodyCoach
// Handles synchronization with external calendar providers

export interface CalendarProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  isConnected: boolean;
  lastSync?: Date;
  syncEnabled: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  attendees?: string[];
  reminders?: number[]; // minutes before event
}

export interface SyncSettings {
  userId: string;
  providers: {
    google?: {
      enabled: boolean;
      calendarId?: string;
      accessToken?: string;
      refreshToken?: string;
      lastSync?: Date;
      syncDirection: 'import' | 'export' | 'bidirectional';
    };
    microsoft?: {
      enabled: boolean;
      calendarId?: string;
      accessToken?: string;
      refreshToken?: string;
      lastSync?: Date;
      syncDirection: 'import' | 'export' | 'bidirectional';
    };
    apple?: {
      enabled: boolean;
      calendarUrl?: string;
      username?: string;
      password?: string;
      lastSync?: Date;
      syncDirection: 'import' | 'export' | 'bidirectional';
    };
  };
  privacy: {
    includeChildNames: boolean;
    includeLocation: boolean;
    includeNotes: boolean;
    useGenericTitles: boolean;
  };
  syncFrequency: 'manual' | 'hourly' | 'daily' | 'weekly';
}

export interface ParentingTimeEvent {
  id: string;
  entryType: string;
  visitDate: string;
  startTime?: string;
  endTime?: string;
  childName?: string;
  location?: string;
  notes?: string;
  isOvernight: boolean;
  isMultiDay: boolean;
  endDate?: string;
}

interface ProviderSettings {
  enabled: boolean;
  calendarId?: string;
  accessToken?: string;
  refreshToken?: string;
  lastSync?: Date;
  syncDirection: 'import' | 'export' | 'bidirectional';
  calendarUrl?: string; // for Apple
  username?: string; // for Apple
  password?: string; // for Apple
}

class CalendarSyncService {
  private static instance: CalendarSyncService;
  private syncSettings: Map<string, SyncSettings> = new Map();

  static getInstance(): CalendarSyncService {
    if (!CalendarSyncService.instance) {
      CalendarSyncService.instance = new CalendarSyncService();
    }
    return CalendarSyncService.instance;
  }

  // Get available calendar providers
  getAvailableProviders(): CalendarProvider[] {
    return [
      {
        id: 'google',
        name: 'Google Calendar',
        icon: '🗓️',
        color: '#4285f4',
        isConnected: false,
        syncEnabled: false
      },
      {
        id: 'microsoft',
        name: 'Outlook Calendar',
        icon: '📅',
        color: '#0078d4',
        isConnected: false,
        syncEnabled: false
      },
      {
        id: 'apple',
        name: 'Apple Calendar',
        icon: '🍎',
        color: '#007aff',
        isConnected: false,
        syncEnabled: false
      }
    ];
  }

  // Convert parenting time entry to calendar event
  convertToCalendarEvent(entry: ParentingTimeEvent, settings: SyncSettings): CalendarEvent {
    const privacy = settings.privacy;
    
    // Generate title based on privacy settings
    let title = privacy.useGenericTitles 
      ? 'Parenting Time' 
      : `${entry.entryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    
    if (!privacy.useGenericTitles && privacy.includeChildNames && entry.childName) {
      title += ` - ${entry.childName}`;
    }

    // Handle multi-day events
    const startDate = new Date(entry.visitDate + (entry.startTime ? `T${entry.startTime}` : 'T00:00'));
    const endDate = entry.isMultiDay && entry.endDate 
      ? new Date(entry.endDate + (entry.endTime ? `T${entry.endTime}` : 'T23:59'))
      : new Date(entry.visitDate + (entry.endTime ? `T${entry.endTime}` : 'T23:59'));

    // Build description
    let description = '';
    if (!privacy.useGenericTitles) {
      description += `Entry Type: ${entry.entryType.replace('_', ' ')}\n`;
    }
    
    if (privacy.includeChildNames && entry.childName) {
      description += `Child: ${entry.childName}\n`;
    }
    
    if (privacy.includeLocation && entry.location) {
      description += `Location: ${entry.location}\n`;
    }
    
    if (privacy.includeNotes && entry.notes) {
      description += `\nNotes: ${entry.notes}`;
    }

    if (entry.isOvernight) {
      description += '\n🌙 Overnight visit';
    }

    return {
      id: entry.id,
      title,
      description: description.trim(),
      startDate,
      endDate,
      allDay: !entry.startTime && !entry.endTime,
      location: privacy.includeLocation ? entry.location : undefined,
      reminders: [60, 1440] // 1 hour and 1 day before
    };
  }

  // Google Calendar Integration
  async connectGoogleCalendar(userId: string): Promise<string> {
    // This would return the OAuth URL for Google Calendar
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/google/callback`;
    
    const scope = 'https://www.googleapis.com/auth/calendar';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `state=${userId}&` +
      `access_type=offline`;

    return authUrl;
  }

  // Microsoft Graph Integration
  async connectMicrosoftCalendar(userId: string): Promise<string> {
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/microsoft/callback`;
    
    const scope = 'https://graph.microsoft.com/calendars.readwrite';
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `state=${userId}`;

    return authUrl;
  }

  // Sync parenting time entries to external calendar
  async syncToExternalCalendar(
    userId: string, 
    entries: ParentingTimeEvent[], 
    provider: string
  ): Promise<{ success: boolean; message: string; synced?: number }> {
    try {
      const settings = this.syncSettings.get(userId);
      if (!settings) {
        return { success: false, message: 'No sync settings found' };
      }

      const providerSettings = settings.providers[provider as keyof typeof settings.providers];
      if (!providerSettings?.enabled) {
        return { success: false, message: `${provider} sync not enabled` };
      }

      let syncedCount = 0;

      for (const entry of entries) {
        const calendarEvent = this.convertToCalendarEvent(entry, settings);
        
        switch (provider) {
          case 'google':
            await this.syncToGoogleCalendar(calendarEvent, providerSettings);
            break;
          case 'microsoft':
            await this.syncToMicrosoftCalendar(calendarEvent, providerSettings);
            break;
          case 'apple':
            await this.syncToAppleCalendar(calendarEvent, providerSettings);
            break;
        }
        
        syncedCount++;
      }

      // Update last sync time
      if (providerSettings) {
        providerSettings.lastSync = new Date();
      }

      return { 
        success: true, 
        message: `Successfully synced ${syncedCount} entries to ${provider}`,
        synced: syncedCount 
      };

    } catch (error) {
      console.error(`Calendar sync error for ${provider}:`, error);
      return { 
        success: false, 
        message: `Failed to sync to ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async syncToGoogleCalendar(event: CalendarEvent, _settings: ProviderSettings): Promise<void> {
    // Implementation would use Google Calendar API
    console.log('Syncing to Google Calendar:', event);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async syncToMicrosoftCalendar(event: CalendarEvent, _settings: ProviderSettings): Promise<void> {
    // Implementation would use Microsoft Graph API
    console.log('Syncing to Microsoft Calendar:', event);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async syncToAppleCalendar(event: CalendarEvent, _settings: ProviderSettings): Promise<void> {
    // Implementation would use CalDAV protocol
    console.log('Syncing to Apple Calendar:', event);
  }

  // Get sync status for user
  getSyncStatus(userId: string): SyncSettings | null {
    return this.syncSettings.get(userId) || null;
  }

  // Update sync settings
  updateSyncSettings(userId: string, settings: Partial<SyncSettings>): void {
    const existing = this.syncSettings.get(userId) || this.getDefaultSyncSettings(userId);
    this.syncSettings.set(userId, { ...existing, ...settings });
  }

  private getDefaultSyncSettings(userId: string): SyncSettings {
    return {
      userId,
      providers: {},
      privacy: {
        includeChildNames: true,
        includeLocation: false,
        includeNotes: false,
        useGenericTitles: false
      },
      syncFrequency: 'manual'
    };
  }
}

export default CalendarSyncService; 