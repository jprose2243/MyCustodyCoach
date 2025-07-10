# MyCustodyCoach Development Guidelines

## 🎯 **CRITICAL: Maintaining Clean State**

**Current Status: v2.1.0 - PRODUCTION READY**
- ✅ Zero conflicts, zero duplicates
- ✅ All navigation tabs working
- ✅ Clean webpack builds
- ✅ Stable Vercel deployment

---

## 🚨 **NEVER DO THESE (Will Break Production)**

### ❌ **DO NOT Create Duplicate Files**
```bash
# NEVER create these again:
app/upload/page.tsx          # DELETED - caused routing conflicts
app/upload/UploadClient.tsx  # DELETED - caused chunk loading errors
utils/extractTextFromFile.ts # DELETED - moved to src/utils/
```

### ❌ **DO NOT Create Duplicate Routes**
- Main upload functionality is in `app/page.tsx` (homepage)
- All navigation points to existing routes: `/communication`, `/evidence`, `/parenting-time`, `/settings`, `/support`
- Never create `/upload` route again

### ❌ **DO NOT Modify These Without Backup**
- `app/UploadClient.tsx` - Main component with navigation
- `vercel.json` - Deployment configuration
- `package.json` - Dependencies (keep JSON clean)
- `next.config.ts` - Build configuration

---

## ✅ **SAFE DEVELOPMENT PRACTICES**

### 1. **Always Work on Feature Branches**
```bash
git checkout -b feature/new-feature-name
# Make changes
git commit -m "Clear description"
git push origin feature/new-feature-name
# Create PR, test, then merge
```

### 2. **Before Making Major Changes**
```bash
# Create safety tag
git tag -a v2.1.1-pre-changes -m "Before [change description]"
git push origin v2.1.1-pre-changes
```

### 3. **File Organization Rules**
- **Components**: Keep in `app/` directory
- **Utilities**: Use `src/utils/` (not root `utils/`)
- **Services**: Use `src/services/`
- **Types**: Use `types/` directory
- **Never duplicate existing files**

### 4. **Navigation Changes**
- Navigation is in `app/UploadClient.tsx` around line 432
- Navigation is **always visible** (not conditional)
- Test locally before deploying

### 5. **Deployment Safety**
```bash
# Test local build first
npm run build

# Check for conflicts
git status

# Only deploy if build succeeds
git add . && git commit -m "Description" && git push origin main
```

---

## 🔄 **Emergency Recovery**

### If Something Breaks:
```bash
# Return to last known good state
git reset --hard v2.1.0

# Force clean deployment
rm -rf .next node_modules/.cache
npm install
npm run build
git push origin main --force
```

### If Build Fails:
```bash
# Check for JSON syntax errors
npm run build 2>&1 | grep -i error

# Common fixes:
# 1. Check package.json has no trailing comments
# 2. Check for missing imports
# 3. Clear build cache: rm -rf .next
```

---

## 📋 **Current Architecture**

### Main Components:
- **Homepage**: `app/page.tsx` (uses UploadClient)
- **UploadClient**: `app/UploadClient.tsx` (main interface + navigation)
- **Features**: `/communication`, `/evidence`, `/parenting-time`, `/settings`, `/support`

### Key Files:
- `vercel.json` - Handles deployment and build cache clearing
- `next.config.ts` - Webpack configuration
- `middleware.ts` - Route protection
- `src/utils/` - Utility functions

### Database:
- All tables created and working
- User profiles auto-create on first login
- Navigation shows for all users

---

## 🎯 **Version Management**

### Current Tags:
- `v2.1.0` - Production ready, clean state
- Use semantic versioning for future releases

### Before Major Changes:
1. Create feature branch
2. Test locally
3. Create pre-change tag
4. Make changes
5. Test again
6. Deploy to production
7. Create new version tag

---

## 🚀 **Future Development**

### Safe to Modify:
- Add new API routes in `app/api/`
- Add new pages (but avoid `/upload`)
- Modify existing components carefully
- Add new utilities in `src/utils/`

### Always Test:
- `npm run build` before every deployment
- Check navigation tabs are visible
- Test main features work
- Verify no console errors

---

**Remember: This platform is working perfectly. Any changes should enhance, not break existing functionality.** 