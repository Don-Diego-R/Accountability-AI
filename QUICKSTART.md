# Quick Start - First Time Setup

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js 18 or higher installed
- [ ] Git installed
- [ ] A Google Cloud account
- [ ] Access to the Google Sheet (ID: 1UnsPseWvNIb1R1P3UhPOsap3kM-4p2OcOpHToGdKhNU)

## Step-by-Step Setup

### 1. Install Node.js Dependencies

Open PowerShell in this directory and run:

```powershell
npm install
```

This will install all required packages (Next.js, React, NextAuth, Google APIs, etc.).

### 2. Set Up Google Cloud

#### A. Create/Configure OAuth 2.0 Client

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - (Later add production URL)
7. **Save the Client ID and Client Secret**

#### B. Create Service Account for Google Sheets

1. Still in **Credentials**, click **Create Credentials** → **Service Account**
2. Give it a name (e.g., "accountability-ai-sheets")
3. Grant role: **Editor**
4. Click **Done**
5. Click on the service account you just created
6. Go to **Keys** tab → **Add Key** → **Create new key**
7. Choose **JSON** and download
8. **Save this JSON file** (you'll need it for .env)

#### C. Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - Google Sheets API
   - Google Sign-In API

### 3. Configure Google Sheet Access

1. Open the downloaded service account JSON file
2. Find the `client_email` field (looks like `xxx@xxx.iam.gserviceaccount.com`)
3. Copy this email
4. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1UnsPseWvNIb1R1P3UhPOsap3kM-4p2OcOpHToGdKhNU/
5. Click **Share**
6. Paste the service account email
7. Give it **Editor** access
8. Click **Send**

### 4. Create Environment File

Create a file named `.env` in the root directory with this content:

```env
# Google OAuth (from step 2A)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1UnsPseWvNIb1R1P3UhPOsap3kM-4p2OcOpHToGdKhNU
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...paste entire JSON here..."}
```

**Important Notes:**
- For `NEXTAUTH_SECRET`, run in PowerShell: `openssl rand -base64 32` (or use any random 32-character string)
- For `GOOGLE_SHEETS_CREDENTIALS`, paste the **entire contents** of your service account JSON file as a **single line**

### 5. Verify Google Sheet Structure

Make sure your Google Sheet has these tabs with proper columns:

#### **database** tab
Must include:
- Column E: **Agent Email** (used for allow-list)
- Other columns: targets for conversations, meetings, listings per day/week/month

#### **Logs** tab  
Must include:
- Date
- Agent Email
- Number of conversations (connects) today
- Number of sales meetings scheduled today
- Number of sales meetings run today
- Number of listings today
- Task 1, Task 1 Completion, Task 2, Task 2 Completion, ... Task 7, Task 7 Completion

### 6. Start the Development Server

```powershell
npm run dev
```

You should see:
```
- Local:        http://localhost:3000
- Ready in Xms
```

### 7. Test the Application

1. Open browser to: http://localhost:3000
2. You'll be redirected to sign-in page
3. Click "Sign in with Google"
4. Sign in with a Google account whose email exists in the Google Sheet (Column E of database tab)
5. You should see the dashboard!

## Verification Checklist

After setup, verify:

- [ ] Can access http://localhost:3000
- [ ] Sign-in page loads
- [ ] Google OAuth popup works
- [ ] After sign-in, redirected to dashboard
- [ ] Dashboard shows your name/email
- [ ] Home tab displays KPI cards
- [ ] Trend tab shows chart
- [ ] Today tab shows today's data
- [ ] Tasks tab shows task list
- [ ] Can toggle task completion
- [ ] Date filter works

## Troubleshooting

### "Module not found" errors
Run: `npm install` again

### "Unauthorized" on sign-in
- Check email exists in Google Sheet column E
- Verify sheet is shared with service account
- Check GOOGLE_SHEETS_CREDENTIALS is valid JSON

### "Redirect URI mismatch"
- Verify OAuth redirect URI includes: `http://localhost:3000/api/auth/callback/google`
- Check NEXTAUTH_URL in .env is `http://localhost:3000`

### No data showing
- Check Logs sheet has data
- Verify date format is YYYY-MM-DD
- Check Agent Email matches signed-in user

### Google Sheets API errors
- Ensure Google Sheets API is enabled in Google Cloud
- Verify service account has Editor access to sheet
- Check spreadsheet ID is correct

## Next Steps

Once everything works locally:

1. Read `DEPLOYMENT.md` for production deployment
2. Review `DEVELOPMENT.md` for development guidelines
3. See full documentation in `README.md`

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review error messages in browser console (F12)
3. Check terminal output for server errors
4. Verify all environment variables are set correctly
