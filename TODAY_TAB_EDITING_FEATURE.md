# Today Tab Log Editing Feature

## Overview
Added the ability for users to manually log their daily performance in the Today tab. Users can edit all visible performance metrics, and the changes are saved to the Google Sheets "Logs" sheet. If no log exists for today, a new row is automatically created.

## Changes Made

### 1. Backend Functions (`src/lib/sheets.ts`)

#### New `updateTodayLog()` function
- **Purpose**: Updates or creates today's log entry in the Google Sheets "Logs" sheet
- **Parameters**:
  - `email`: User's email for authentication and row lookup
  - `logData`: Object containing field names and values to update
- **Behavior**:
  - Calculates today's date in the user's timezone
  - Searches for existing log entry for today
  - If found: Updates the existing row using batch update
  - If not found: Creates a new row with all provided data
- **Returns**: `boolean` indicating success/failure

### 2. API Route (`src/app/api/logs/route.ts`)

#### New `PUT` endpoint
- **Purpose**: Handle log updates from the frontend
- **Validation**:
  - Requires authentication (checks session)
  - Validates logData object structure
- **Response**: Returns success status or error message

### 3. User Interface (`src/components/TodayTab.tsx`)

#### New Features
- **"Log today's performance manually" button**: Enters edit mode
- **Edit Mode**:
  - All visible metric fields become editable number inputs
  - Input fields have blue background and blue bottom border for clarity
  - Progress section (on pace/keep going) is hidden during edit mode
- **Save/Cancel buttons**:
  - Green "Save" button - saves all changes to Google Sheets
  - Gray "Cancel" button - discards changes and exits edit mode

#### Enhanced Metrics Display
- Added `field` property to each metric mapping to the exact Google Sheets column name
- Added support for Sales ($) and GCI ($) fields for Real Estate users
- Input fields support decimals for currency fields (`step="0.01"`)
- Numbers displayed with proper formatting (currency with $ and commas)

#### New State Management
- `isEditMode`: Boolean tracking whether user is in edit mode
- `editedValues`: Object storing temporary edited values before save

#### New Functions
- `startEditMode()`: Initializes edit mode with current values
- `cancelEditMode()`: Exits edit mode without saving
- `saveLog()`: Saves all edited values to Google Sheets via API

## Field Mappings

The following fields can be edited (based on user's targets and industry):

| UI Label | Google Sheets Column Name |
|----------|--------------------------|
| Conversations | Number of conversations (connects) today |
| Meetings Scheduled | Number of sales meetings scheduled today |
| Meetings Held | Number of sales meetings run today |
| Listings Won | Number of listings today |
| Appraisals | Number of in-person appraisals today |
| Listing Presentations | Number of listing presentations today |
| Offers Presented | Number of offers presented today |
| Group Presentations | Number of group sales presentations today |
| Current Sales ($) | Current sales today ($) |
| Current GCI ($) | Current GCI ($) |

## User Flow

1. **View Today's Progress**: User sees their current performance metrics
2. **Enter Edit Mode**: Click "Log today's performance manually" button
3. **Edit Values**: All visible fields become editable number inputs
4. **Save Changes**:
   - Click "Save" button
   - All values are sent to Google Sheets
   - Success message displayed
   - UI updates with new values
   - Returns to view mode
5. **Cancel Editing**:
   - Click "Cancel" button
   - All changes discarded
   - Returns to view mode

## Technical Details

### Data Persistence
- Updates existing log row if one exists for today (in user's timezone)
- Creates new log row if today's log doesn't exist yet
- Uses batch update for efficiency when updating existing row
- Properly handles timezone conversion for date matching

### Validation
- Number inputs only (type="number")
- Currency fields support decimals (step="0.01")
- Empty fields default to 0 when saved
- All fields optional - user can update only some fields

### Visual Design
- Edit mode indicated by:
  - Blue background on input fields (`bg-blue-50`)
  - Blue bottom border (`border-blue-500`)
  - Bold blue text (`text-gray-900`)
  - Save/Cancel buttons replace the edit button
- Maintains responsive grid layout
- Progress section hidden during edit to reduce clutter

### Error Handling
- API errors shown via alert dialogs
- Detailed console logging for debugging
- Validates session authentication
- Graceful handling of missing data

## Security
- All updates require valid authentication session
- Email verification ensures users only update their own logs
- Row ownership verified before updates
- Uses user's timezone for accurate date matching

## Future Enhancements (Optional)
- Real-time validation of input values
- Field-level save (instead of all at once)
- Undo functionality
- Auto-save drafts
- Historical log editing (not just today)
- Bulk import from CSV
