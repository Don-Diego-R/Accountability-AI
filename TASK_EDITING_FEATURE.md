# Task Editing Feature

## Overview
Added the ability for users to manually edit open tasks in the Tasks tab. Edited task text is immediately synchronized with the corresponding row in the Google Sheets "Logs" sheet.

## Changes Made

### 1. Type Definitions (`src/types/index.ts`)
- **Enhanced `Task` interface** with two new optional fields:
  - `rowIndex?: number` - Tracks the 1-indexed row number in Google Sheets for precise updates
  - `date?: string` - Stores the date of the log entry (DD/MM/YYYY format)

### 2. Backend Functions (`src/lib/sheets.ts`)

#### Updated `getTasks()` function
- Now returns `rowIndex` and `date` for each task
- Modified to track the exact row index in the Logs sheet
- Changed to use a backward loop to find the most recent user row more efficiently

#### New `updateTaskText()` function
- **Purpose**: Updates task text in the Google Sheets Logs sheet
- **Security**: Verifies the row belongs to the authenticated user before updating
- **Parameters**:
  - `email`: User's email for verification
  - `taskId`: Task number (1-3)
  - `taskText`: New task text
  - `rowIndex`: Row number in the sheet to update
- **Returns**: `boolean` indicating success/failure

### 3. API Route (`src/app/api/tasks/route.ts`)

#### New `PUT` endpoint
- **Purpose**: Handle task text updates from the frontend
- **Validation**:
  - Requires authentication (checks session)
  - Validates request parameters (taskId, taskText, rowIndex)
  - Ensures task text is not empty
- **Response**: Returns success status or error message

### 4. User Interface

#### TasksTab Component (`src/components/TasksTab.tsx`)

**New Features:**
- **Inline Editing**: Click the edit icon (✏️) on any open task to edit it
- **Edit Mode UI**:
  - Input field with auto-focus
  - Save button (💾) - green color
  - Cancel button (✖) - gray color
- **Keyboard Shortcuts**:
  - `Enter` - Save changes
  - `Escape` - Cancel editing
- **Visual Feedback**:
  - Edit icon appears on hover (smooth opacity transition)
  - Added `group` class to task items for hover effects

**New State Management:**
- `editingTaskId`: Tracks which task is currently being edited
- `editedText`: Stores the temporary edited text

**New Functions:**
- `startEditing(task)`: Enters edit mode for a task
- `cancelEditing()`: Exits edit mode without saving
- `saveTaskText(task)`: Saves edited text to Google Sheets with optimistic updates

#### HomeTab Component (`src/components/HomeTab.tsx`)

**Updated with identical editing functionality:**
- **Inline Editing**: Edit icon (✏️) appears on hover next to the checkbox
- **Edit Mode UI**: Same input field, save, and cancel buttons
- **Keyboard Shortcuts**: Same `Enter` to save, `Escape` to cancel
- **Layout**: Edit and checkbox buttons are side-by-side in the task row
- **Visual Feedback**: Edit icon appears on hover with smooth transition

**New State Management:**
- `editingTaskId`: Tracks which task is currently being edited
- `editedText`: Stores the temporary edited text

**New Functions:**
- `startEditing(task)`: Enters edit mode for a task
- `cancelEditing()`: Exits edit mode without saving
- `saveTaskText(task)`: Saves edited text to Google Sheets with optimistic updates

## User Flow

### From Tasks Tab:
1. **View Tasks**: User sees their open tasks in the Tasks tab
2. **Enter Edit Mode**: User hovers over a task and clicks the edit icon (✏️)
3. **Edit Text**: Task text becomes an editable input field
4. **Save Changes**:
   - Click the save button, OR
   - Press `Enter` key
5. **Cancel Editing**:
   - Click the cancel button, OR
   - Press `Escape` key

### From Home Tab:
1. **View Dashboard**: User sees KPI metrics and open tasks at the bottom
2. **Enter Edit Mode**: User hovers over a task and clicks the edit icon (✏️) next to the checkbox
3. **Edit Text**: Task text becomes an editable input field
4. **Save Changes**: Same as Tasks tab (click save or press `Enter`)
5. **Cancel Editing**: Same as Tasks tab (click cancel or press `Escape`)
6. **Complete Task**: User can still check the checkbox to mark as complete

## Technical Details

### Optimistic Updates
- UI updates immediately when user saves
- If the API call fails, changes are reverted
- User sees error message via `alert()` if update fails

### Error Handling
- Validates task text is not empty
- Verifies rowIndex exists before attempting update
- Reverts optimistic updates on failure
- Logs detailed error information to console

### Google Sheets Integration
- Uses the existing sheet structure (Logs sheet)
- Updates the appropriate "Task N" column based on taskId
- Verifies row ownership before updating (security)
- Uses 1-indexed row numbers (Google Sheets standard)

## Icons Used
- `Edit2` (lucide-react) - Edit button
- `Save` (lucide-react) - Save button
- `X` (lucide-react) - Cancel button

## Future Enhancements (Optional)
- Add a confirmation dialog for task deletion
- Support for adding new tasks
- Drag-and-drop task reordering
- Rich text editing capabilities
- Undo/redo functionality
