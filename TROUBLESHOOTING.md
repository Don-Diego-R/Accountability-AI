# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### ❌ "Cannot find module" errors after cloning

**Cause:** Dependencies not installed

**Solution:**
```powershell
npm install
```

#### ❌ npm install fails with permission errors

**Cause:** Insufficient permissions or conflicting Node versions

**Solutions:**
1. Run PowerShell as Administrator
2. Check Node.js version: `node --version` (need 18+)
3. Clear npm cache: `npm cache clean --force`
4. Delete `node_modules` and `package-lock.json`, then reinstall

---

### Environment Configuration Issues

#### ❌ "process.env.GOOGLE_CLIENT_ID is undefined"

**Cause:** .env file missing or not loaded

**Solutions:**
1. Ensure `.env` file exists in root directory
2. Restart dev server: `npm run dev`
3. Check `.env` syntax (no quotes around values needed)
4. Verify no typos in variable names

#### ❌ "Invalid credentials" for Google Sheets

**Cause:** Malformed JSON in GOOGLE_SHEETS_CREDENTIALS

**Solutions:**
1. Ensure JSON is on a single line
2. Check all quotes are properly escaped
3. Verify it's the complete JSON from service account key
4. Test JSON validity: paste into https://jsonlint.com/

**Correct Format:**
```env
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"xxx",...}
```

---

### Authentication Issues

#### ❌ "Access Denied" or "Unauthorized" after Google Sign-In

**Cause:** User email not in allow-list

**Solutions:**
1. Open Google Sheet
2. Check "database" tab, Column E (Agent Email)
3. Verify email exists and matches exactly
4. Check for extra spaces or different capitalization
5. Wait 5 minutes for cache to refresh, or restart server

#### ❌ "Redirect URI mismatch" error

**Cause:** OAuth redirect URI not configured

**Solutions:**
1. Go to Google Cloud Console → Credentials
2. Edit OAuth 2.0 Client ID
3. Add: `http://localhost:3000/api/auth/callback/google`
4. For production, also add: `https://yourdomain.com/api/auth/callback/google`
5. Save and try again

#### ❌ Can't sign out / Session persists

**Cause:** Browser caching or cookie issues

**Solutions:**
1. Clear browser cookies for localhost
2. Try incognito/private window
3. Restart dev server
4. Check NEXTAUTH_URL matches current URL

---

### Google Sheets Issues

#### ❌ "Failed to fetch data from Google Sheets"

**Cause:** Service account doesn't have access

**Solutions:**
1. Open Google Sheet
2. Click Share button
3. Add service account email (from JSON key file)
4. Grant "Editor" permissions
5. Click "Send"

#### ❌ "Google Sheets API has not been enabled"

**Cause:** API not enabled in Google Cloud Project

**Solutions:**
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" → "Library"
3. Search for "Google Sheets API"
4. Click "Enable"
5. Wait a few minutes, then try again

#### ❌ "Spreadsheet not found" error

**Cause:** Wrong spreadsheet ID

**Solutions:**
1. Open your Google Sheet
2. Copy ID from URL: `https://docs.google.com/spreadsheets/d/{ID}/edit`
3. Update GOOGLE_SHEETS_SPREADSHEET_ID in .env
4. Restart dev server

---

### Data Display Issues

#### ❌ Dashboard shows "No data available"

**Cause:** Empty or incorrectly structured sheets

**Solutions:**
1. Check "Logs" sheet has data
2. Verify "Agent Email" column exists and matches signed-in user
3. Check date format is YYYY-MM-DD
4. Ensure column names match exactly:
   - "Number of conversations (connects) today"
   - "Number of sales meetings scheduled today"
   - etc.

#### ❌ Wrong data showing / Data from other user

**Cause:** Email filtering not working

**Solutions:**
1. Sign out and sign in again
2. Check "Agent Email" in Logs matches signed-in email exactly
3. Clear browser cache
4. Check sheets.ts filtering logic

#### ❌ Dates not filtering correctly

**Cause:** Date format mismatch

**Solutions:**
1. Ensure all dates in Logs sheet are YYYY-MM-DD format
2. Check no extra spaces in date cells
3. Verify Date column is text/plain text (not date formatted)

---

### Task Issues

#### ❌ Tasks not showing up

**Cause:** Missing task columns or empty tasks

**Solutions:**
1. Check Logs sheet has columns: Task 1, Task 1 Completion, Task 2, Task 2 Completion, etc.
2. Verify at least one task has text (not empty)
3. Check user has a row in Logs sheet
4. Ensure column names match exactly (case-sensitive)

#### ❌ Task toggle doesn't save

**Cause:** Service account lacks write permissions

**Solutions:**
1. Verify service account has "Editor" (not "Viewer") access
2. Check no sheet protections preventing writes
3. Check browser console for API errors
4. Verify Task X Completion columns exist

#### ❌ Task shows wrong completion status

**Cause:** Completion value not TRUE/FALSE

**Solutions:**
1. Check "Task X Completion" cells contain TRUE or FALSE (not 1/0 or yes/no)
2. Manually set a cell to TRUE to test
3. Verify app writes TRUE/FALSE correctly

---

### Performance Issues

#### ❌ Slow initial load

**Causes & Solutions:**
1. **Large dataset:** Limit date range in Logs sheet
2. **Network:** Check internet connection
3. **Google Sheets API:** Normal for first call, subsequent calls cached
4. **Development mode:** Production builds are faster

#### ❌ Chart doesn't render

**Cause:** Missing or invalid data

**Solutions:**
1. Check Logs sheet has data for selected date range
2. Verify numeric fields have valid numbers (not text)
3. Check browser console for errors
4. Try smaller date range

---

### Development Issues

#### ❌ TypeScript errors in editor

**Cause:** Expected before `npm install`

**Solutions:**
1. Run `npm install` first
2. Restart VS Code / editor
3. Check TypeScript version: `npx tsc --version`
4. Errors should clear after dependencies installed

#### ❌ "Module not found" for Next.js imports

**Cause:** Development server not running or stale build

**Solutions:**
1. Stop server (Ctrl+C)
2. Delete `.next` folder
3. Run `npm run dev` again

#### ❌ Changes not reflecting in browser

**Cause:** Hot reload not working

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Restart dev server
4. Check no errors in terminal

---

### Production / Deployment Issues

#### ❌ Build fails in Vercel

**Cause:** Environment variables missing or TypeScript errors

**Solutions:**
1. Check all env vars set in Vercel dashboard
2. Run `npm run build` locally to test
3. Check build logs for specific errors
4. Ensure no TypeScript errors in code

#### ❌ OAuth doesn't work in production

**Cause:** Redirect URIs not configured

**Solutions:**
1. Add production URL to Google OAuth settings
2. Update NEXTAUTH_URL to production domain
3. Ensure HTTPS (not HTTP) in production
4. Check redirect URI: `https://yourdomain.com/api/auth/callback/google`

#### ❌ "Invalid secret" error in production

**Cause:** NEXTAUTH_SECRET not set or different from local

**Solutions:**
1. Generate new secret: `openssl rand -base64 32`
2. Set in production environment variables
3. Don't copy from .env directly (generate new for production)
4. Redeploy after setting

---

### Browser-Specific Issues

#### ❌ Safari: Cookies blocked

**Cause:** Safari's strict cookie policies

**Solutions:**
1. Disable "Prevent cross-site tracking" in Safari settings
2. Use Chrome/Firefox for development
3. In production, ensure same-site cookies configured

#### ❌ Firefox: OAuth popup blocked

**Cause:** Popup blocker

**Solutions:**
1. Allow popups for localhost
2. Check browser console for popup blocked message
3. Try signing in directly (not popup)

---

### Debug Checklist

When something doesn't work:

1. **Check browser console** (F12 → Console tab)
   - Look for red errors
   - Note any warnings

2. **Check terminal output**
   - Server errors appear here
   - API route logs

3. **Check Network tab** (F12 → Network)
   - See which requests fail
   - Check response codes (200 = good, 401 = auth issue, 500 = server error)

4. **Check .env file**
   - All variables set?
   - No typos?
   - Valid values?

5. **Check Google Sheet**
   - Correct structure?
   - Data exists?
   - Shared with service account?

6. **Check Google Cloud**
   - APIs enabled?
   - Credentials valid?
   - Redirect URIs correct?

---

## Getting Help

If you've tried all solutions above:

1. **Document the issue:**
   - What you did
   - What you expected
   - What actually happened
   - Error messages (exact text)
   - Screenshots

2. **Check logs:**
   - Browser console errors
   - Terminal server errors
   - Network request/response

3. **Isolate the problem:**
   - Does it work in incognito?
   - Does it work with different user?
   - Does it work with different browser?

4. **Contact support:**
   - Include all documentation above
   - Include environment (OS, Node version, browser)
   - Include relevant code snippets

---

## Quick Fixes

### Reset Everything
```powershell
# Stop server (Ctrl+C)
# Delete generated files
Remove-Item -Recurse -Force node_modules, .next

# Reinstall
npm install

# Restart
npm run dev
```

### Clear All Caches
```powershell
# NPM cache
npm cache clean --force

# Browser: Ctrl+Shift+Delete, clear all

# Restart computer (if desperate!)
```

### Test Minimal Setup
Create minimal .env:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-please-replace-in-production
GOOGLE_CLIENT_ID=test
GOOGLE_CLIENT_SECRET=test
GOOGLE_SHEETS_SPREADSHEET_ID=test
GOOGLE_SHEETS_CREDENTIALS={}
```

If app starts, gradually add real values.

---

## Still Stuck?

Check these files for more info:
- `README.md` - Full documentation
- `QUICKSTART.md` - Setup guide
- `DEVELOPMENT.md` - Dev workflow
- `TESTING.md` - Testing guide
