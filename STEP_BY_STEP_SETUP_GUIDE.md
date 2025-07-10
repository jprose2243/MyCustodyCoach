# 🎯 MyCustodyCoach Complete Setup Guide

## Overview
Follow these exact steps to set up your Supabase database for all MyCustodyCoach features. **Do these steps BEFORE deploying to Vercel.**

---

## 📋 **Step-by-Step Setup Process**

### **Step 1: Access Your Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your MyCustodyCoach project
4. Click on "SQL Editor" in the left sidebar

---

### **Step 2: Deploy Communication Log Schema (REQUIRED)**

**This is the most critical step - Communication Log won't work without this!**

1. **Copy the Schema**:
   - Open `communication-log-schema.sql` in your project
   - Select ALL content (Cmd+A / Ctrl+A)
   - Copy it (Cmd+C / Ctrl+C)

2. **Run in Supabase**:
   - In Supabase SQL Editor, click "New Query"
   - Paste the entire schema (Cmd+V / Ctrl+V)
   - Click "Run" button (or Cmd+Enter)
   - **Wait for it to complete** - should take 10-15 seconds

3. **Verify Success**:
   ```sql
   -- Run this verification query:
   SELECT 
     (SELECT COUNT(*) FROM communication_types) as types_count,
     (SELECT COUNT(*) FROM communication_priorities) as priorities_count,
     (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'communication%') as tables_count;
   
   -- Expected result: types_count: 8, priorities_count: 3, tables_count: 5
   ```

4. **If you get an error**:
   - Make sure you copied the ENTIRE file
   - Check that your project has sufficient permissions
   - Try running smaller sections if needed

---

### **Step 3: Verify Evidence Organizer Schema**

1. **Check if it exists**:
   ```sql
   SELECT COUNT(*) FROM evidence_categories;
   ```
   - **Expected result**: 8 categories

2. **If result is 0 or error**:
   - Open `evidence-organizer-schema.sql`
   - Copy entire contents
   - Paste and run in Supabase SQL Editor
   - Re-run verification query

---

### **Step 4: Verify Parenting Time Schema**

1. **Check if it exists**:
   ```sql
   SELECT COUNT(*) FROM parenting_entry_types;
   ```
   - **Expected result**: 7 entry types

2. **If result is 0 or error**:
   - Open `parenting-time-schema.sql`
   - Copy entire contents
   - Paste and run in Supabase SQL Editor
   - Re-run verification query

---

### **Step 5: Set Up File Storage**

1. **Go to Storage**:
   - Click "Storage" in Supabase left sidebar
   - Click "Create Bucket"

2. **Create user-files bucket**:
   - Bucket name: `user-files`
   - Public: **UNCHECKED** (private bucket)
   - Click "Create Bucket"

3. **Set up policies**:
   - Click on the `user-files` bucket
   - Go to "Policies" tab
   - Click "Add Policy" and select "Custom Policy"

4. **Add Upload Policy**:
   ```sql
   -- Policy name: Allow authenticated users to upload files
   -- Operation: INSERT
   -- Target roles: authenticated
   
   (auth.uid() IS NOT NULL)
   ```

5. **Add Read Policy**:
   ```sql
   -- Policy name: Allow users to read their own files
   -- Operation: SELECT  
   -- Target roles: authenticated
   
   (auth.uid()::text = (storage.foldername(name))[1])
   ```

6. **Add Delete Policy**:
   ```sql
   -- Policy name: Allow users to delete their own files
   -- Operation: DELETE
   -- Target roles: authenticated
   
   (auth.uid()::text = (storage.foldername(name))[1])
   ```

---

### **Step 6: Update User Profiles Table**

1. **Check current columns**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'user_profiles' 
   AND column_name IN ('children_count', 'subscription_cancelled_at');
   ```

2. **If missing columns**:
   - Open `add-children-count-column.sql`
   - Copy contents and run in SQL Editor

3. **Verify columns added**:
   ```sql
   SELECT children_count, subscription_cancelled_at 
   FROM user_profiles 
   LIMIT 1;
   ```

---

### **Step 7: Test All Schemas Work Together**

**Run this comprehensive test:**

```sql
-- Test 1: Communication Log
INSERT INTO communication_entries (
  user_id, entry_date, communication_type, direction, subject, content, participants
) VALUES (
  auth.uid(), CURRENT_DATE, 'text', 'incoming', 'Test Message', 'This is a test communication', '["Test Person"]'
);

-- Test 2: Evidence Organizer
INSERT INTO evidence_items (
  user_id, category_id, title, description
) VALUES (
  auth.uid(), 
  (SELECT id FROM evidence_categories WHERE name = 'Communication' LIMIT 1), 
  'Test Evidence', 
  'Test evidence description'
);

-- Test 3: Parenting Time
INSERT INTO parenting_time_entries (
  user_id, entry_type, visit_date, child_name, notes
) VALUES (
  auth.uid(), 'scheduled_visit', CURRENT_DATE, 'Test Child', 'Test parenting time entry'
);

-- Test 4: Get Statistics
SELECT 
  (SELECT COUNT(*) FROM communication_entries WHERE user_id = auth.uid()) as communications,
  (SELECT COUNT(*) FROM evidence_items WHERE user_id = auth.uid()) as evidence,
  (SELECT COUNT(*) FROM parenting_time_entries WHERE user_id = auth.uid()) as parenting_entries;

-- Clean up test data
DELETE FROM communication_entries WHERE user_id = auth.uid() AND subject = 'Test Message';
DELETE FROM evidence_items WHERE user_id = auth.uid() AND title = 'Test Evidence';
DELETE FROM parenting_time_entries WHERE user_id = auth.uid() AND child_name = 'Test Child';
```

**Expected result**: All inserts work, statistics show counts, then data is cleaned up.

---

### **Step 8: Final Verification Checklist**

Run each query and verify expected results:

```sql
-- ✅ Communication Log Tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'communication%';
-- Expected: 5 tables

-- ✅ Evidence Organizer  
SELECT COUNT(*) FROM evidence_categories;
-- Expected: 8

-- ✅ Parenting Time
SELECT COUNT(*) FROM parenting_entry_types;  
-- Expected: 7

-- ✅ Storage Bucket
SELECT name, public FROM storage.buckets WHERE name = 'user-files';
-- Expected: user-files | false

-- ✅ User Profile Columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('children_count', 'subscription_cancelled_at');
-- Expected: 2 rows

-- ✅ Row Level Security Enabled
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('communication_entries', 'evidence_items', 'parenting_time_entries');
-- Expected: Multiple policy rows
```

---

## 🚨 **Common Issues & Solutions**

### **Error: "function does not exist"**
- **Cause**: Incomplete schema deployment
- **Solution**: Re-run the entire schema file, don't run partial sections

### **Error: "permission denied for table"**
- **Cause**: RLS policies not applied
- **Solution**: Verify you ran the complete schema including policy creation

### **Communication Log shows empty**
- **Cause**: Communication schema not deployed
- **Solution**: Run `communication-log-schema.sql` completely

### **Statistics show 0/0/0**
- **Cause**: Views not created
- **Solution**: Check that all schemas created their views successfully

### **File upload fails**
- **Cause**: Storage bucket or policies missing
- **Solution**: Follow Step 5 completely, verify bucket exists

---

## ✅ **Success Indicators**

**After completing all steps, you should have:**
- ✅ 5 communication tables created
- ✅ 8 evidence categories 
- ✅ 7 parenting time entry types
- ✅ user-files storage bucket with policies
- ✅ Updated user_profiles table
- ✅ All test queries working
- ✅ RLS policies protecting user data

---

## 🚀 **Next Steps: Deploy to Vercel**

**Only after ALL steps above are complete:**

1. Commit all your code changes:
   ```bash
   git add .
   git commit -m "🚀 Complete MCC feature release: Communication Log, Evidence Organizer, Enhanced UI"
   git push origin main
   ```

2. **Vercel will automatically deploy** when you push to main

3. **Test the live deployment**:
   - Sign up for new account
   - Upload a file and get AI response
   - Add a communication entry
   - Add evidence
   - Add parenting time entry
   - Verify all statistics work

---

**🎯 Your database is now ready for the complete MyCustodyCoach experience!** 