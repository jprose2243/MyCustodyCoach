# 🚀 MyCustodyCoach Supabase Deployment Guide

## Overview
This guide covers the complete database schema setup required for all the new features we've built. **CRITICAL**: These schemas must be deployed to Supabase before pushing the application to production.

---

## 🗄️ Required Database Schemas

### ✅ **Schema Status Summary**
| Feature | Schema File | Status | Required Action |
|---------|-------------|--------|-----------------|
| **Communication Log** | `communication-log-schema.sql` | ❌ **MISSING** | **MUST RUN** |
| **Evidence Organizer** | `evidence-organizer-schema.sql` | ✅ Exists | Verify deployed |
| **Parenting Time** | `parenting-time-schema.sql` | ✅ Exists | Verify deployed |
| **File Storage** | `setup-supabase-storage.md` | ⚠️ Check | Verify bucket exists |
| **User Profiles** | `add-children-count-column.sql` | ⚠️ Check | Verify columns added |

---

## 🚨 **CRITICAL: Communication Log Schema**

**The Communication Log feature is completely non-functional without this schema!**

### Step 1: Deploy Communication Schema
```sql
-- Copy the entire contents of communication-log-schema.sql
-- and run in Supabase SQL Editor
```

**File**: `communication-log-schema.sql`

**What it creates:**
- `communication_types` - 8 predefined types (Text, Email, Phone, etc.)
- `communication_priorities` - 3 priority levels (Routine, Important, Emergency)
- `communication_entries` - Main table for all communications
- `communication_timeline` - Audit trail for changes
- `communication_view` - Enhanced view with type/priority info
- `communication_stats_view` - Statistics for dashboard
- **Row Level Security** policies for user data isolation
- **Search function** with full-text search capabilities

---

## 📋 **Complete Deployment Checklist**

### **Step 1: Communication Log (REQUIRED)**
```bash
# In Supabase SQL Editor:
# 1. Copy all contents from communication-log-schema.sql
# 2. Paste and run the entire script
# 3. Verify tables created:
```

```sql
-- Verification queries:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'communication%';

-- Should return:
-- communication_types
-- communication_priorities  
-- communication_entries
-- communication_timeline
-- communication_relationships

-- Check types inserted:
SELECT COUNT(*) FROM communication_types; -- Should be 8
SELECT COUNT(*) FROM communication_priorities; -- Should be 3
```

### **Step 2: Evidence Organizer (Verify Existing)**
```sql
-- Check if Evidence Organizer is deployed:
SELECT COUNT(*) FROM evidence_categories; -- Should be 8
SELECT COUNT(*) FROM evidence_items; -- Can be 0 (no user data yet)

-- If missing, run: evidence-organizer-schema.sql
```

### **Step 3: Parenting Time (Verify Existing)**
```sql
-- Check if Parenting Time is deployed:
SELECT COUNT(*) FROM parenting_entry_types; -- Should be 7
SELECT COUNT(*) FROM parenting_time_entries; -- Can be 0 (no user data yet)

-- If missing, run: parenting-time-schema.sql
```

### **Step 4: File Storage (Verify Bucket)**
```sql
-- Check storage bucket exists:
SELECT name, public FROM storage.buckets WHERE name = 'user-files';

-- Should return: user-files | false
-- If missing, follow: setup-supabase-storage.md
```

### **Step 5: User Profile Updates**
```sql
-- Check if new columns exist:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('children_count', 'subscription_cancelled_at');

-- Should return both columns
-- If missing, run: add-children-count-column.sql
```

---

## 🔧 **Feature Dependencies**

### **Communication Log Dependencies:**
- ✅ `auth.users` table (Supabase built-in)
- ✅ `user_profiles` table (existing)
- ⚠️ `parenting_time_entries` table (for linking - optional)
- ⚠️ `evidence_items` table (for linking - optional)

### **Enhanced Statistics Dependencies:**
- ✅ All parenting time tables must exist
- ✅ Views must be created for `past_visits` and `upcoming_visits` calculations

---

## 📊 **New Features Requiring Database Support**

### **1. Communication Log Statistics**
Our UI displays these statistics that require the database:
- Total Communications count
- Pending Responses count  
- Average Response Time calculation
- This Month communications count
- Communication types breakdown

**Query Used:**
```sql
SELECT * FROM communication_stats_view WHERE user_id = $1;
```

### **2. Enhanced Parenting Time Stats**
Our UI shows "Past Visits" and "Upcoming Visits" which need:
```sql
-- Past visits (date < today)
SELECT COUNT(*) FROM parenting_time_entries 
WHERE user_id = $1 AND visit_date < CURRENT_DATE;

-- Upcoming visits (date >= today)
SELECT COUNT(*) FROM parenting_time_entries 
WHERE user_id = $1 AND visit_date >= CURRENT_DATE;
```

### **3. Evidence Categories**
Our UI has 7 new categories that need to exist in `evidence_categories`:
- Document Preparation
- Co-Parenting Communication
- Court Preparation  
- Medical & Health Decisions
- School & Education
- Holidays & Vacation Planning
- Emergency Situations

---

## 🔍 **Testing Database Deployment**

### **After running all schemas, test:**

```sql
-- 1. Communication Log Test
INSERT INTO communication_entries (
  user_id, entry_date, communication_type, direction, subject, content, participants
) VALUES (
  auth.uid(), CURRENT_DATE, 'text', 'incoming', 'Test Message', 'This is a test', '["Test Person"]'
);

-- 2. Evidence Organizer Test  
INSERT INTO evidence_items (
  user_id, category_id, title, description
) VALUES (
  auth.uid(), (SELECT id FROM evidence_categories WHERE name = 'Communication'), 'Test Evidence', 'Test description'
);

-- 3. Parenting Time Test
INSERT INTO parenting_time_entries (
  user_id, entry_type, visit_date, child_name, notes
) VALUES (
  auth.uid(), 'scheduled_visit', CURRENT_DATE, 'Test Child', 'Test visit'
);
```

---

## ⚡ **Quick Deployment Commands**

```bash
# 1. Copy and run in Supabase SQL Editor (in order):

# REQUIRED - Communication Log
cat communication-log-schema.sql
# Copy output and run in Supabase

# VERIFY - Evidence Organizer  
cat evidence-organizer-schema.sql
# Run if not already deployed

# VERIFY - Parenting Time
cat parenting-time-schema.sql  
# Run if not already deployed

# VERIFY - User Profile Updates
cat add-children-count-column.sql
# Run if columns missing

# 2. Check storage bucket exists in Supabase Storage tab
# 3. Test each feature in the UI after deployment
```

---

## 🚨 **Critical Production Notes**

### **BEFORE DEPLOYING TO VERCEL:**
1. ✅ **ALL schemas must be deployed to Supabase first**
2. ✅ **Test each feature manually in staging**
3. ✅ **Verify RLS policies are working**
4. ✅ **Check that statistics views return data**

### **Common Deployment Issues:**
- **Communication Log shows "No communications"** → Schema not deployed
- **Statistics show 0/0/0** → Views not created properly  
- **File upload fails** → Storage bucket missing
- **User profile errors** → New columns missing
- **Permission denied errors** → RLS policies not applied

### **Rollback Plan:**
If issues occur, the schemas are designed to be safe:
- All tables use `CREATE TABLE IF NOT EXISTS`
- All indexes use `CREATE INDEX IF NOT EXISTS`  
- All data inserts use `ON CONFLICT DO NOTHING`
- No existing data will be modified

---

## ✅ **Deployment Success Verification**

### **After deployment, verify these work:**
1. **Communication Log**: Can add new communications and see statistics
2. **Evidence Organizer**: Categories load and evidence can be added
3. **Parenting Time**: Can add visits and see past/upcoming counts
4. **File Upload**: Files upload successfully and AI processes them
5. **Navigation**: All new nav items work properly

### **If any feature fails:**
1. Check browser console for errors
2. Verify the corresponding schema was deployed
3. Check Supabase logs for database errors
4. Ensure RLS policies allow the current user

---

**🎯 Ready to deploy! All features will be fully functional once these schemas are in place.** 