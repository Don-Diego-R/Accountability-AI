# Accountability AI Dashboard

A zero-friction daily accountability dashboard for sales professionals (real estate agents and B2B sales). The app provides instant visibility into KPIs, tracks goals vs actuals, and helps users stay on pace with their targets.

> **📚 New here?** Check the [Documentation Index](DOCUMENTATION_INDEX.md) for a guided tour of all documentation, or jump straight to [QUICKSTART.md](QUICKSTART.md) to get started in 30 minutes!

## 🎯 Purpose

Give sales professionals a simple dashboard that:
- Shows key metrics: Conversations, Meetings Scheduled, Meetings Held, Listings Won
- Tracks actual vs target with visual progress bars
- Provides trend analysis over custom date ranges
- Displays today's progress with coaching nudges
- Manages daily tasks with one-tap completion

**North Star**: "Open app → instantly know: Am I on track today? What's next?"

## 🚀 Features

### Authentication
- Google Sign-In only (no passwords)
- Allow-list based access control (users must exist in Google Sheet)
- Row-level security (users only see their own data)

### Dashboard Tabs

#### Home
- Four KPI cards in 2×2 grid
- Progress bars (green ≥100%, amber 60-99%, red <60%)
- Actual vs Target comparison

#### Trend
- Daily line charts for all metrics
- Customizable date ranges
- Multi-metric visualization

#### Today
- Today's snapshot
- "On pace" indicator
- Friendly coaching nudges (e.g., "+3 conversations to stay on track")

#### Tasks
- Open and completed tasks
- One-tap toggle to mark complete
- Syncs with Google Sheets

### Date Filtering
- "This Month" preset (default)
- Custom Start/End date pickers
- Filters apply across all relevant tabs

## 📋 Prerequisites

- Node.js 18+ 
- Google Cloud Project with:
  - OAuth 2.0 credentials (for Google Sign-In)
  - Service Account (for Google Sheets API)
- Google Sheet with proper structure (see Data Sources below)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Don-Diego-R/Accountability-AI.git
cd Accountability-AI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Google Cloud Project

#### A. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Sign-In API**
4. Go to **APIs & Services** → **Credentials**
5. Create **OAuth 2.0 Client ID** (Web application)
6. Add authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
7. Copy **Client ID** and **Client Secret**

#### B. Create Service Account for Google Sheets

1. In Google Cloud Console → **APIs & Services** → **Credentials**
2. Create **Service Account**
3. Grant it **Editor** role
4. Create a **JSON key** and download it
5. Enable **Google Sheets API** in your project
6. Share your Google Sheet with the service account email (found in JSON)

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=1UnsPseWvNIb1R1P3UhPOsap3kM-4p2OcOpHToGdKhNU
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**For GOOGLE_SHEETS_CREDENTIALS:**
Copy the entire contents of your service account JSON file as a single-line string.

### 5. Set Up Google Sheets

Your Google Sheet must have these tabs:

#### **database** tab (Jotform submissions)
Contains user targets with these columns:
- ID
- Submission Date
- Agent Name
- Agent Last Name
- **Agent Email** (Column E - used for allow-list)
- Agent Mobile Number
- Agent Industry
- Agent Time Zone from Forms
- Target number of conversations (connects) / day
- Target number of sales meetings scheduled / day
- Target number of sales meetings run / day
- Target number of listings / month
- What's your average monthly sales goal ($)

#### **Logs** tab (daily activity logs)
Contains daily actuals with these columns:
- Date
- ID
- Agent Name
- Agent Last Name
- **Agent Email**
- Number of conversations (connects) today
- Number of sales meetings scheduled today
- Number of sales meetings run today
- Number of listings today
- Current sales today ($)
- Task 1, Task 1 Completion
- Task 2, Task 2 Completion
- ... (up to Task 7)

**Important:** Share the sheet with your service account email!

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Update `NEXTAUTH_URL` to your production domain
5. Add production redirect URI to Google OAuth settings
6. Deploy!

### Environment Variables for Production

Make sure to set all variables from `.env` in your hosting platform:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (your production URL)
- `NEXTAUTH_SECRET`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_CREDENTIALS`

## 🏗️ Project Structure

```
accountability-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth config
│   │   │   ├── targets/route.ts             # User targets API
│   │   │   ├── logs/route.ts                # Daily logs API
│   │   │   └── tasks/route.ts               # Tasks API
│   │   ├── auth/signin/page.tsx             # Sign-in page
│   │   ├── dashboard/page.tsx               # Dashboard page
│   │   ├── layout.tsx                       # Root layout
│   │   ├── page.tsx                         # Home redirect
│   │   └── globals.css                      # Global styles
│   ├── components/
│   │   ├── AuthProvider.tsx                 # Session provider
│   │   ├── Dashboard.tsx                    # Main dashboard
│   │   ├── HomeTab.tsx                      # KPI cards
│   │   ├── TrendTab.tsx                     # Chart view
│   │   ├── TodayTab.tsx                     # Today snapshot
│   │   └── TasksTab.tsx                     # Task list
│   └── lib/
│       ├── auth.ts                          # Auth options export
│       └── sheets.ts                        # Google Sheets client
├── .env.example                             # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Security & Privacy

- **Google Sign-In only:** No password storage or management
- **Allow-list enforcement:** Users must exist in Google Sheet to access
- **Row-level isolation:** Users only see their own data
- **PII protection:** No cross-user data visibility
- **Service account:** Secure server-side Google Sheets access
- **Caching:** Allow-list cached for 5 minutes to reduce API calls

## 📊 Data Flow

1. User signs in with Google → NextAuth validates
2. Email checked against **database** sheet (Column E)
3. If allowed, session created
4. Dashboard loads user-specific data:
   - Targets from **database** sheet
   - Actuals from **Logs** sheet
   - Tasks from **Logs** sheet
5. Task toggles write back to **Logs** sheet

## 🎨 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js with Google Provider
- **Data Source:** Google Sheets API
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns

## 🐛 Troubleshooting

### "Unauthorized" error on sign-in
- Check that user's email exists in Google Sheet Column E
- Verify sheet is shared with service account
- Check `GOOGLE_SHEETS_CREDENTIALS` is valid JSON

### "No data available"
- Ensure **Logs** sheet has data for the selected date range
- Check column names match exactly (case-sensitive)
- Verify dates are in `YYYY-MM-DD` format

### Google Sheets API errors
- Verify Google Sheets API is enabled
- Check service account has Editor access
- Ensure `GOOGLE_SHEETS_SPREADSHEET_ID` is correct

### Tasks not updating
- Check **Logs** sheet has Task 1-7 Completion columns
- Verify user has a row in **Logs** sheet
- Check console for API errors

## 📝 License

MIT

## 🤝 Contributing

This is a private project for specific sales teams. Contact the repo owner for access.

## 📧 Support

For issues or questions, please contact the administrator.