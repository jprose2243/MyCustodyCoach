# Parenting Time Log Setup Guide

## Overview
The Parenting Time Log replaces the conversation history with a comprehensive system to track custody visits, missed visits, and important notes with visual organization.

## Features
- ✅ Track scheduled visits, missed visits, makeup visits
- ⏰ Record start/end times for each visit
- 📍 Log locations and involved parties
- 📝 Add detailed notes and observations
- 📊 Statistics dashboard showing visit patterns
- 🏷️ Categorized entry types with color coding
- 🔒 User-specific data with full privacy protection

## Database Setup

### 1. Run the SQL Schema
Execute `parenting-time-schema.sql` in your Supabase SQL editor:
```bash
# Copy the SQL content and run in Supabase SQL Editor
cat parenting-time-schema.sql
```

### 2. Verify Tables Created
After running the SQL, verify these tables exist:
- `parenting_entry_types` - Entry categories and visual styling
- `parenting_time_entries` - Main data table for all entries
- `parenting_calendar_view` - View for calendar display
- `parenting_stats_view` - Aggregated statistics

### 3. Test Entry Types
The system comes with 7 predefined entry types:
- ✅ **Scheduled Visit** - Normal parenting time that occurred
- ❌ **Missed Visit (Parent)** - Parent didn't show up
- ⚠️ **Missed Visit (Child)** - Child unavailable
- 🔄 **Makeup Visit** - Makeup for previously missed time
- ⏰ **Early Return** - Child returned early
- 📅 **Extended Visit** - Visit went longer than scheduled
- 📝 **Note Only** - General observation without visit

## Navigation Updates
The system automatically updates navigation to replace "History" with "Parenting Time" in:
- Main UploadClient component (`app/UploadClient.tsx`)
- Upload folder component (`app/upload/UploadClient.tsx`)

## Page Structure
```
/parenting-time
├── Main dashboard with statistics
├── List view of recent entries
├── Add entry modal with full form
└── Calendar view (coming soon)
```

## Data Fields Tracked
For each parenting time entry:
- **Required:** Date, Entry Type
- **Time:** Start/end times (optional)
- **People:** Child name, pickup/dropoff persons
- **Location:** Where visit took place
- **Flags:** Overnight visit, other parent present
- **Notes:** Detailed observations and context

## Security & Privacy
- All data is user-specific (Row Level Security enabled)
- Users can only see/edit their own entries
- Full audit trail with created/updated timestamps
- Data deletion follows user account deletion

## Statistics Dashboard
Real-time stats showing:
- Total entries logged
- Successful visits count
- Missed visits breakdown  
- Makeup visits tracking
- Overnight stays count

## Usage Tips
1. **Regular Logging:** Add entries immediately after visits for accuracy
2. **Detailed Notes:** Include specific details that might be relevant for court
3. **Consistent Timing:** Always record start/end times when possible
4. **Location Tracking:** Note pickup/dropoff locations for patterns
5. **Evidence Connection:** Reference relevant evidence entries in notes

## Future Enhancements
- Visual calendar view with color-coded entries
- Export functionality for court documents
- Integration with Evidence Organizer
- Automated reminders for regular logging
- Pattern analysis and insights

## Troubleshooting

### Common Issues
1. **Page not loading:** Ensure SQL schema was executed successfully
2. **Can't add entries:** Check user authentication and database permissions
3. **Stats not updating:** Refresh page or check for database errors

### Database Queries for Debugging
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'parenting%';

-- View entry types
SELECT * FROM parenting_entry_types ORDER BY id;

-- Check user's entries (replace USER_ID)
SELECT * FROM parenting_calendar_view 
WHERE user_id = 'USER_ID' 
ORDER BY visit_date DESC;
```

## Support
For issues with the Parenting Time Log:
1. Check this setup guide
2. Verify database setup completed
3. Contact support with specific error messages 