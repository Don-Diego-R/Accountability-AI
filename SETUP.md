# Accountability AI - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in the values:

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

#### NextAuth Secret
Generate with:
```bash
openssl rand -base64 32
```

#### Google Sheets
1. Create a Service Account in Google Cloud
2. Download JSON key
3. Enable Google Sheets API
4. Share your sheet with service account email
5. Copy JSON contents to `GOOGLE_SHEETS_CREDENTIALS` (single line)
6. Set `GOOGLE_SHEETS_SPREADSHEET_ID` from your sheet URL

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Google Sheet Structure

### Required Tabs

#### 1. database
- Contains user targets from Jotform
- Must have "Agent Email" in column E
- Include target columns for conversations, meetings, listings

#### 2. Logs  
- Contains daily activity logs
- Must have columns:
  - Date
  - Agent Email
  - Number of conversations (connects) today
  - Number of sales meetings scheduled today
  - Number of sales meetings run today
  - Number of listings today
  - Task 1 through Task 7
  - Task 1 Completion through Task 7 Completion

### Share Sheet
Share the Google Sheet with your service account email (found in JSON key file).

## Deployment to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Update `NEXTAUTH_URL` to production URL
5. Update Google OAuth redirect URIs
6. Deploy!

## Troubleshooting

**Can't sign in?**
- Verify email exists in Google Sheet column E
- Check sheet is shared with service account

**No data showing?**
- Check Logs sheet has data
- Verify column names match exactly
- Ensure dates are YYYY-MM-DD format

**Tasks not updating?**
- Check Logs sheet has Task Completion columns
- Verify service account has Editor permissions
