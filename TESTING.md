# Accountability AI - Testing Guide

## Manual Testing Checklist

### Pre-Test Setup
- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file configured with valid credentials
- [ ] Google Sheet accessible and shared with service account
- [ ] At least one test user email in Google Sheet database tab
- [ ] Some test data in Logs sheet

### Authentication Tests

#### Sign-In Flow
- [ ] Navigate to http://localhost:3000
- [ ] Redirects to `/auth/signin`
- [ ] "Sign in with Google" button visible
- [ ] Click button opens Google OAuth popup
- [ ] Can select Google account
- [ ] After selection, popup closes

#### Allow-List Validation
- [ ] Sign in with email that EXISTS in Google Sheet
  - [ ] Should successfully sign in
  - [ ] Should redirect to `/dashboard`
  - [ ] Should see dashboard content
  
- [ ] Sign in with email that DOESN'T EXIST in Google Sheet
  - [ ] Should be denied access
  - [ ] Should show error or stay on sign-in page

#### Session Persistence
- [ ] After signing in, refresh page
  - [ ] Should remain signed in
  - [ ] Should not redirect to sign-in page
  
- [ ] Click "Sign Out"
  - [ ] Should sign out
  - [ ] Should redirect to sign-in page

### Dashboard Tests

#### Layout & Navigation
- [ ] Dashboard header shows "Accountability Dashboard"
- [ ] User email displayed in top-right
- [ ] Sign Out button visible
- [ ] Four tabs visible: Home, Trend, Today, Tasks
- [ ] Date filter dropdown shows "This Month"
- [ ] Can switch between tabs
- [ ] Active tab is highlighted (blue underline)

#### Date Filtering
- [ ] Default shows "This Month"
- [ ] Change to "Custom"
  - [ ] Start date picker appears
  - [ ] End date picker appears
  - [ ] Can select custom dates
  - [ ] Data updates when dates change
- [ ] Change back to "This Month"
  - [ ] Date pickers disappear
  - [ ] Data resets to current month

### Home Tab Tests

#### KPI Cards Display
- [ ] Four cards visible in 2x2 grid
- [ ] Cards show: Conversations, Meetings Scheduled, Meetings Held, Listings Won
- [ ] Each card shows:
  - [ ] Title
  - [ ] Large actual number
  - [ ] "Target · X" subtitle
  - [ ] Progress bar

#### Progress Bar Colors
- [ ] If actual ≥ target: green bar
- [ ] If actual between 60%-99% of target: amber bar
- [ ] If actual < 60% of target: red bar
- [ ] Bar width matches percentage (max 100%)

#### Data Accuracy
- [ ] Numbers match Google Sheet Logs data
- [ ] Totals calculated correctly for date range
- [ ] Changing date range updates numbers
- [ ] Targets match database sheet values

### Trend Tab Tests

#### Chart Display
- [ ] Line chart renders
- [ ] X-axis shows dates
- [ ] Y-axis shows counts
- [ ] Four lines visible (different colors)
- [ ] Legend shows: Conversations, Meetings Scheduled, Meetings Held, Listings Won
- [ ] Tooltip appears on hover

#### Chart Data
- [ ] Data points match Google Sheet Logs
- [ ] Lines connect chronologically
- [ ] Changing date range updates chart
- [ ] Empty dates handled gracefully

### Today Tab Tests

#### Today's Data Display
- [ ] Shows current date in friendly format
- [ ] Four metric boxes show today's counts
- [ ] Each shows "X of Y" (actual of target)
- [ ] Listings Won shown (no target needed)

#### On-Pace Indicator
- [ ] If ALL targets met: Green box, "You're on pace!" message
- [ ] If ANY target NOT met: Amber box, "Keep going!" message
- [ ] Amber box lists specific gaps:
  - [ ] "+X conversations to stay on track"
  - [ ] "+X meetings to schedule"
  - [ ] Etc.

#### Data Accuracy
- [ ] Today's counts match Google Sheet for today
- [ ] Targets match database sheet
- [ ] Refreshing page shows updated data

### Tasks Tab Tests

#### Task Display
- [ ] "Open Tasks" section shows incomplete tasks
- [ ] "Completed Tasks" section shows completed tasks
- [ ] Each task shows:
  - [ ] Circle icon (empty for open, checkmark for completed)
  - [ ] Task text
- [ ] If no open tasks: "No open tasks. Great job!" message

#### Task Interaction
- [ ] Click open task circle
  - [ ] Task moves to completed section
  - [ ] UI updates immediately
  - [ ] Google Sheet updates (check manually)
  
- [ ] Click completed task checkmark
  - [ ] Task moves back to open section
  - [ ] UI updates immediately
  - [ ] Google Sheet updates

#### Task Data
- [ ] Tasks pulled from latest Logs entry
- [ ] Only shows tasks with non-empty text
- [ ] Completion status matches sheet

### Responsive Design Tests

#### Desktop (>1024px)
- [ ] 2x2 grid on Home tab
- [ ] Chart fills width on Trend tab
- [ ] All content readable
- [ ] No horizontal scroll

#### Tablet (768-1024px)
- [ ] 2x2 grid still works
- [ ] Date filters may wrap
- [ ] Chart responsive

#### Mobile (<768px)
- [ ] KPI cards stack (1 column)
- [ ] Tabs scrollable/accessible
- [ ] Date filters stack
- [ ] Chart responsive
- [ ] Tasks list readable

### Error Handling Tests

#### Network Errors
- [ ] Disconnect internet
  - [ ] Shows loading state
  - [ ] Eventually shows error or "No data"
  - [ ] Doesn't crash

#### Invalid Data
- [ ] Empty Logs sheet
  - [ ] Home tab: "No data available"
  - [ ] Trend tab: "No data available for this date range"
  - [ ] Today tab: Shows 0 for all metrics

#### Missing Targets
- [ ] User with no targets in database sheet
  - [ ] Graceful handling
  - [ ] No crash

### Performance Tests

#### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Tab switching instant (<100ms)
- [ ] Date filter change < 1 second
- [ ] Task toggle instant

#### Caching
- [ ] First sign-in queries Google Sheets
- [ ] Within 5 minutes, sign-in uses cache
- [ ] After 5 minutes, cache refreshes

### Security Tests

#### Access Control
- [ ] Can't access `/dashboard` without signing in
- [ ] Signing out clears session
- [ ] Can't access other users' data

#### Data Isolation
- [ ] Sign in as User A
  - [ ] See only User A's data
- [ ] Sign out, sign in as User B
  - [ ] See only User B's data
  - [ ] No User A data visible

### Browser Compatibility Tests

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest, if on Mac)

Check:
- [ ] All features work
- [ ] Layout correct
- [ ] No console errors
- [ ] OAuth works

## Automated Testing (Future)

### Unit Tests (Not Yet Implemented)
- Google Sheets functions
- Utility functions
- KPI color calculation
- Date calculations

### Integration Tests (Not Yet Implemented)
- API routes
- Authentication flow
- Data fetching

### E2E Tests (Not Yet Implemented)
- Full user journeys
- Task completion flow
- Date filtering flow

## Test Data Setup

### Sample Users in Google Sheet
Create test entries with:
- Different target levels
- Various completion percentages
- Some with/without tasks

### Sample Logs
Create entries with:
- Today's date
- Past dates (for trend)
- Various metric values
- Task data (Task 1-7, completions)

## Bug Reporting

When you find a bug, document:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/device
5. Console errors (if any)
6. Screenshot (if helpful)
