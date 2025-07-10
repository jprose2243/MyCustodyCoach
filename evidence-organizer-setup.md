# Evidence Organizer Setup Guide

## Overview
The Evidence Organizer is a comprehensive system for parents to collect, categorize, and manage evidence for custody cases. It includes 8 predefined categories, advanced search/filtering, and detailed metadata tracking.

## 🛠️ **Setup Instructions**

### Step 1: Set Up Database Schema
Run the SQL script in your Supabase SQL Editor:

```bash
# In your Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy and paste the contents of evidence-organizer-schema.sql
# 3. Click "Run" to create all tables, policies, and views
```

This will create:
- **Evidence Categories** (8 predefined types)
- **Evidence Items** (main evidence table)
- **Evidence Collections** (for grouping)
- **Evidence Timeline** (audit trail)
- **Row Level Security** policies
- **Helper views** and functions

### Step 2: Verify Database Setup
After running the schema, verify the setup:

```sql
-- Check that categories were created
SELECT * FROM evidence_categories ORDER BY sort_order;

-- Verify RLS policies are active
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'evidence%';
```

### Step 3: Test the Features
1. **Navigate to Evidence Organizer**: Visit `/evidence` in your app
2. **Add test evidence**: Click "Add Evidence" and create a test item
3. **Test filtering**: Use category, search, and importance filters
4. **Test navigation**: Verify links work between pages

## 📂 **Evidence Categories**

The system includes 8 predefined categories:

| Category | Icon | Description |
|----------|------|-------------|
| **Communication** | 💬 | Text messages, emails, voicemails |
| **Documents** | 📄 | Court orders, legal papers, records |
| **Incidents** | ⚠️ | Concerning behaviors or violations |
| **Photos/Videos** | 📸 | Visual evidence, conditions |
| **Financial** | 💰 | Support records, receipts |
| **Medical** | 🏥 | Medical records, health communications |
| **School** | 🎓 | School records, attendance |
| **Other** | 📁 | Miscellaneous evidence |

## 🔥 **Key Features**

### **Evidence Management**
- ✅ **Rich metadata**: Date, time, people, location, importance
- ✅ **Tagging system**: Custom tags for organization
- ✅ **Court admissibility**: Flag evidence ready for court
- ✅ **Importance levels**: 1-5 scale for prioritization
- ✅ **Soft delete**: Recoverable deletion system

### **Organization & Search**
- ✅ **Category filtering**: Filter by evidence type
- ✅ **Full-text search**: Search titles, descriptions, content
- ✅ **Importance filtering**: Show only high-priority items
- ✅ **Multiple sort options**: By date, importance, or title
- ✅ **Grid/List views**: Toggle between view modes

### **Integration**
- ✅ **User authentication**: Tied to existing user system
- ✅ **Navigation integration**: Accessible from main app
- ✅ **Profile integration**: Pre-populates user data
- ✅ **Audit trail**: Tracks all changes automatically

## 🚀 **Usage Instructions**

### **Adding Evidence**
1. Click "📂 Evidence" in navigation or visit `/evidence`
2. Click "+ Add Evidence"
3. Select a category (required)
4. Fill in title (required) and optional details
5. Add tags, people involved, location as needed
6. Set importance level and court admissibility
7. Click "Add Evidence"

### **Organizing Evidence**
- **Search**: Use the search bar to find specific evidence
- **Filter by category**: Select specific evidence types
- **Filter by importance**: Show only critical evidence
- **Sort**: Organize by date, importance, or title
- **View modes**: Switch between list and grid views

### **Managing Evidence**
- **View details**: Click any evidence item to see full details
- **Edit**: Update information as needed
- **Archive**: Move old evidence to archive
- **Delete**: Soft delete with recovery option

## 🔐 **Security Features**

### **Data Protection**
- **Row Level Security**: Users can only access their own evidence
- **Soft deletion**: Evidence marked as deleted, not permanently removed
- **Audit logging**: All changes tracked in timeline
- **User isolation**: Complete data separation between users

### **Privacy Compliance**
- **GDPR ready**: User can request data deletion
- **Audit trail**: Complete history of data changes
- **Secure access**: Authentication required for all operations

## 📊 **Database Schema Overview**

```
evidence_categories
├── Predefined evidence types
├── Icons and colors for UI
└── Sort order for display

evidence_items
├── User's evidence entries
├── Rich metadata fields
├── Tagging and categorization
└── Soft delete capability

evidence_collections
├── Custom groupings
├── User-defined organization
└── Many-to-many with items

evidence_timeline
├── Audit trail
├── Change tracking
└── User actions log
```

## 🔧 **Troubleshooting**

### **Common Issues**

**Categories not showing:**
```sql
-- Check if categories were inserted
SELECT COUNT(*) FROM evidence_categories;
-- Should return 8
```

**Permission errors:**
```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'evidence_items';
```

**Navigation not working:**
- Clear browser cache
- Check console for JavaScript errors
- Verify user authentication

### **Performance Optimization**
- All tables have appropriate indexes
- Views are optimized for common queries
- RLS policies use efficient filtering

## 🎯 **Next Steps**

After setup, consider:
1. **User training**: Show users how to add and organize evidence
2. **Data import**: Help users migrate existing evidence
3. **Backup strategy**: Regular database backups
4. **Monitoring**: Track usage and performance

The Evidence Organizer is now ready to help parents build strong, organized cases for custody proceedings! 