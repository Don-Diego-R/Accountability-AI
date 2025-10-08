# Accountability AI - Development Guide

## Development Workflow

### Initial Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Then start dev server
npm run dev
```

### Project Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Code Structure

### API Routes (`src/app/api/`)
- `auth/[...nextauth]/route.ts` - Authentication handler
- `targets/route.ts` - GET user targets from Google Sheets
- `logs/route.ts` - GET daily logs filtered by date
- `tasks/route.ts` - GET/PATCH tasks

### Components (`src/components/`)
- `Dashboard.tsx` - Main dashboard with tabs and filters
- `HomeTab.tsx` - KPI cards with progress bars
- `TrendTab.tsx` - Line charts using Recharts
- `TodayTab.tsx` - Today's snapshot with coaching
- `TasksTab.tsx` - Task list with toggles

### Library (`src/lib/`)
- `auth.ts` - NextAuth configuration
- `sheets.ts` - Google Sheets API client with caching

## Data Layer

### Google Sheets Functions

#### `checkAllowList(email: string)`
- Checks if user exists in database sheet
- Cached for 5 minutes
- Returns boolean

#### `getUserTargets(email: string)`
- Fetches user's target metrics
- Returns object with target values

#### `getDailyLogs(email, startDate, endDate)`
- Fetches logs for date range
- Filters by user email
- Returns array of log objects

#### `getTasks(email: string)`
- Gets tasks from most recent log entry
- Returns array of tasks with completion status

#### `updateTaskCompletion(email, taskId, completed)`
- Updates task completion in Google Sheets
- Returns boolean success

## Adding New Features

### Adding a New KPI

1. **Update Google Sheet**: Add column to database and Logs sheets
2. **Update `sheets.ts`**: Add field to getUserTargets and getDailyLogs
3. **Update `HomeTab.tsx`**: Add new KPICard
4. **Update `TrendTab.tsx`**: Add line to chart
5. **Update `TodayTab.tsx`**: Add metric to today's view

### Adding a New Tab

1. Create component in `src/components/NewTab.tsx`
2. Import in `Dashboard.tsx`
3. Add to Tab type union
4. Add to tab navigation array
5. Add conditional render in tab content section

## Environment Variables

### Development
```env
NEXTAUTH_URL=http://localhost:3000
```

### Production
```env
NEXTAUTH_URL=https://your-domain.com
```

## Testing Locally

### Test Authentication
1. Sign in with Google account
2. Verify email is in Google Sheet column E
3. Should see dashboard on successful sign-in
4. Should be denied if email not in allow-list

### Test Data Loading
1. Check Home tab shows correct totals
2. Change date range, verify data updates
3. Check Trend tab renders chart
4. Verify Today tab shows today's data

### Test Tasks
1. Click task circle to mark complete
2. Check Google Sheet updates
3. Click again to unmark
4. Verify UI updates immediately

## Common Issues

### TypeScript Errors
The errors shown in the editor are expected before running `npm install`. Once dependencies are installed, they will resolve.

### Google Sheets Permissions
- Service account needs Editor access
- Sheet must be shared with service account email
- Check credentials JSON is valid

### Date Format
- All dates must be YYYY-MM-DD
- Check Logs sheet uses consistent format

### Caching
- Allow-list cached for 5 minutes
- To force refresh, restart dev server

## Performance Optimization

### Current Optimizations
- Allow-list caching (5 min)
- Server-side data fetching
- Static page generation where possible
- Efficient Google Sheets queries

### Future Improvements
- Add Redis for longer caching
- Implement SWR for client-side caching
- Add optimistic UI updates
- Paginate large datasets

## Security Checklist

- ✅ Google Sign-In only (no passwords)
- ✅ Allow-list enforcement
- ✅ Row-level security (email filtering)
- ✅ Server-side API calls only
- ✅ Environment variables for secrets
- ✅ Service account for sheets access

## API Endpoints

### GET `/api/targets`
Returns user's targets from database sheet.

**Response:**
```json
{
  "conversationsPerDay": 10,
  "meetingsScheduledPerDay": 3,
  "meetingsHeldPerDay": 2,
  "listingsPerMonth": 5
}
```

### GET `/api/logs?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Returns daily logs for date range.

**Response:**
```json
[
  {
    "date": "2025-10-01",
    "Number of conversations (connects) today": "12",
    "Number of sales meetings scheduled today": "4"
  }
]
```

### GET `/api/tasks`
Returns user's current tasks.

**Response:**
```json
[
  {
    "id": 1,
    "task": "Follow up with client",
    "completed": false
  }
]
```

### PATCH `/api/tasks`
Updates task completion.

**Request:**
```json
{
  "taskId": 1,
  "completed": true
}
```

**Response:**
```json
{
  "success": true
}
```
