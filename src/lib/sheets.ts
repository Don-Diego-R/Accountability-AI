import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!

// Cache for allow-list (5 minutes)
let allowListCache: { emails: Set<string>; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Initialize Google Sheets API
function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}')
  
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

export async function checkAllowList(email: string): Promise<boolean> {
  const now = Date.now()
  
  // Return cached result if available and fresh
  if (allowListCache && now - allowListCache.timestamp < CACHE_DURATION) {
    return allowListCache.emails.has(email.toLowerCase())
  }

  try {
    const sheets = getSheetsClient()
    
    // Read from Users Table sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users Table!E:E', // Column E contains Agent Email
    })

    const emails = new Set<string>()
    const rows = response.data.values || []
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        emails.add(rows[i][0].toLowerCase().trim())
      }
    }

    // Update cache
    allowListCache = { emails, timestamp: now }
    
    return emails.has(email.toLowerCase())
  } catch (error) {
    console.error('Error checking allow-list:', error)
    return false
  }
}

export async function getUserTargets(email: string) {
  try {
    const sheets = getSheetsClient()
    
    // Read entire Users Table sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Users Table!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 2) return null

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    
    // Find all rows with matching email, take the LAST one (most recent submission)
    let userRow = null
    for (let i = rows.length - 1; i > 0; i--) {
      if (rows[i][emailIndex]?.toLowerCase().trim() === email.toLowerCase()) {
        userRow = rows[i]
        break
      }
    }

    if (!userRow) return null

    // Map to object
    const userData: any = {}
    headers.forEach((header, idx) => {
      userData[header] = userRow[idx] || null
    })

    return {
      id: userData['ID'], // Store the ID for later use
      industry: userData['Agent Industry'],
      timezone: userData['Agent Timezone (UTC)'] || 'UTC+0',
      conversationsPerDay: parseInt(userData['Target number of conversations (connects) / day']) || 0,
      meetingsScheduledPerDay: parseInt(userData['Target number of sales meetings scheduled / day']) || 0,
      meetingsHeldPerDay: parseInt(userData['Target number of sales meetings run / day']) || 0,
      listingsPerMonth: parseInt(userData['Target number of listings / month']) || 0,
      appraisalsPerWeek: parseInt(userData['Target number of in-person appraisals / week']) || 0,
      listingPresentationsPerWeek: parseInt(userData['Target number of listing presentations / week']) || 0,
      offersPerDay: parseInt(userData['Target number of offers presented / day']) || 0,
      groupPresentationsPerWeek: parseInt(userData['Target number of group sales presentations / week']) || 0,
      monthlySalesGoal: parseFloat(userData['What\'s your average monthly sales goal ($)']) || 0,
      monthlyGCIGoal: parseFloat(userData['What\'s your average monthly GCI goal ($)']) || 0,
    }
  } catch (error) {
    console.error('Error fetching user targets:', error)
    return null
  }
}

export async function getDailyLogs(email: string, startDate: string, endDate: string) {
  try {
    console.log('📊 getDailyLogs called:', { email, startDate, endDate })
    
    const sheets = getSheetsClient()
    
    // Read entire Logs sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    console.log('📋 Total rows from Logs sheet:', rows.length)
    
    if (rows.length < 2) {
      console.log('⚠️ No data rows in Logs sheet')
      return []
    }

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    const dateIndex = headers.indexOf('Date')
    
    console.log('📍 Column indices:', { emailIndex, dateIndex })
    
    // Parse date range (YYYY-MM-DD format from app)
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    console.log('📅 Parsed date range:', { 
      start: start.toISOString(), 
      end: end.toISOString(),
      startLocal: start.toString(),
      endLocal: end.toString()
    })
    
    // Filter logs for this user within date range
    const logs = rows
      .slice(1)
      .filter(row => {
        const rowEmail = row[emailIndex]?.toLowerCase().trim()
        const rowDateStr = row[dateIndex]
        
        if (rowEmail !== email.toLowerCase()) return false
        if (!rowDateStr) return false
        
        // Parse DD/MM/YYYY format from Google Sheets
        const parts = rowDateStr.split('/')
        if (parts.length !== 3) {
          console.log('⚠️ Invalid date format:', rowDateStr)
          return false
        }
        
        const day = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1 // JS months are 0-indexed
        const year = parseInt(parts[2])
        // Create date at midnight UTC to avoid timezone issues
        const rowDate = new Date(Date.UTC(year, month, day))
        
        const matches = rowDate >= start && rowDate <= end
        
        console.log('🔍 Row check:', {
          rowDateStr,
          parsedParts: { day, month: month + 1, year },
          rowDate: rowDate.toISOString(),
          rowDateLocal: rowDate.toString(),
          rowEmail,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          matches
        })
        
        return matches
      })
      .map(row => {
        const log: any = { date: row[dateIndex] }
        headers.forEach((header, idx) => {
          if (idx !== emailIndex && idx !== dateIndex) {
            log[header] = row[idx] || null
          }
        })
        return log
      })

    console.log('✅ Filtered logs count:', logs.length)
    console.log('📦 Logs data:', logs)

    return logs
  } catch (error) {
    console.error('Error fetching daily logs:', error)
    return []
  }
}

async function ensureTodayLogExists(email: string): Promise<boolean> {
  try {
    console.log('🔍 Checking if today\'s log exists for:', email)
    
    const sheets = getSheetsClient()
    
    // Get user's timezone to determine "today"
    const userTargets = await getUserTargets(email)
    if (!userTargets) {
      console.log('❌ Could not get user targets')
      return false
    }
    
    // Calculate today's date in user's timezone
    const { utcOffsetToIANA } = await import('./timezone')
    const { toZonedTime } = await import('date-fns-tz')
    const { format } = await import('date-fns')
    
    const ianaTimezone = utcOffsetToIANA(userTargets.timezone)
    const now = new Date()
    const userTime = toZonedTime(now, ianaTimezone)
    const todayDateStr = format(userTime, 'd/M/yyyy') // DD/MM/YYYY format for Google Sheets
    
    console.log('📅 Today in user timezone:', todayDateStr)
    
    // Read entire Logs sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 1) {
      console.log('❌ No header row in Logs sheet')
      return false
    }

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    const dateIndex = headers.indexOf('Date')
    
    // Check if today's row exists for this user
    let todayRowExists = false
    for (let i = 1; i < rows.length; i++) {
      const rowEmail = rows[i][emailIndex]?.toLowerCase().trim()
      const rowDate = rows[i][dateIndex]
      
      if (rowEmail === email.toLowerCase() && rowDate === todayDateStr) {
        todayRowExists = true
        console.log('✅ Today\'s log already exists at row', i + 1)
        break
      }
    }

    // If today's log doesn't exist, create it
    if (!todayRowExists) {
      console.log('📝 Creating today\'s log entry')
      
      // Prepare new row with just email and date (all other fields empty)
      const newRow = new Array(headers.length).fill('')
      newRow[emailIndex] = email
      newRow[dateIndex] = todayDateStr
      
      // Append the new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Logs!A:Z',
        valueInputOption: 'RAW',
        requestBody: {
          values: [newRow],
        },
      })
      
      console.log('✅ Today\'s log entry created')
    }
    
    return true
  } catch (error) {
    console.error('❌ Error ensuring today\'s log exists:', error)
    return false
  }
}

export async function getTasks(email: string, startDate?: string, endDate?: string) {
  try {
    console.log('📋 getTasks called for:', email, { startDate, endDate })
    
    // First, ensure today's log entry exists
    await ensureTodayLogExists(email)
    
    const sheets = getSheetsClient()
    
    // Get user's timezone
    const userTargets = await getUserTargets(email)
    if (!userTargets) {
      console.log('❌ Could not get user targets')
      return []
    }
    
    // Calculate today's date in user's timezone
    const { utcOffsetToIANA } = await import('./timezone')
    const { toZonedTime } = await import('date-fns-tz')
    const { format, parse } = await import('date-fns')
    
    const ianaTimezone = utcOffsetToIANA(userTargets.timezone)
    const now = new Date()
    const userTime = toZonedTime(now, ianaTimezone)
    const todayDateStr = format(userTime, 'd/M/yyyy') // DD/MM/YYYY format for Google Sheets
    
    // Read tasks from Logs sheet (Task columns)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 2) return []

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    const dateIndex = headers.indexOf('Date')
    
    // If no date range provided, return only today's tasks (legacy behavior)
    if (!startDate || !endDate) {
      // Find TODAY's row for this user
      let todayRowIndex = -1
      for (let i = rows.length - 1; i >= 1; i--) {
        const rowEmail = rows[i][emailIndex]?.toLowerCase().trim()
        const rowDate = rows[i][dateIndex]
        
        if (rowEmail === email.toLowerCase() && rowDate === todayDateStr) {
          todayRowIndex = i
          console.log('✅ Found today\'s row at index:', todayRowIndex + 1)
          break
        }
      }
      
      if (todayRowIndex === -1) {
        console.log('⚠️ Could not find today\'s log')
        return []
      }
      
      const todayRow = rows[todayRowIndex]
      const tasks = []

      // Extract tasks (Task 1-3 only)
      for (let i = 1; i <= 3; i++) {
        const taskIndex = headers.indexOf(`Task ${i}`)
        const completionIndex = headers.indexOf(`Task ${i} Completion`)
        
        if (taskIndex !== -1 && todayRow[taskIndex]) {
          tasks.push({
            id: i,
            task: todayRow[taskIndex],
            completed: todayRow[completionIndex]?.toLowerCase() === 'true' || todayRow[completionIndex] === '1',
            rowIndex: todayRowIndex + 1,
            date: todayRow[dateIndex] || '',
          })
        }
      }

      console.log('📋 Returning', tasks.length, 'tasks for today')
      return tasks
    }
    
    // Date range provided - fetch tasks for all dates in range
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    console.log('📅 Fetching tasks for date range:', { start: start.toISOString(), end: end.toISOString() })
    
    // Find all rows for this user within date range
    const tasksByDate: Record<string, any[]> = {}
    
    for (let i = 1; i < rows.length; i++) {
      const rowEmail = rows[i][emailIndex]?.toLowerCase().trim()
      const rowDateStr = rows[i][dateIndex]
      
      if (rowEmail !== email.toLowerCase() || !rowDateStr) continue
      
      // Parse DD/MM/YYYY format from Google Sheets
      const parts = rowDateStr.split('/')
      if (parts.length !== 3) continue
      
      const day = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1 // JS months are 0-indexed
      const year = parseInt(parts[2])
      const rowDate = new Date(Date.UTC(year, month, day))
      
      // Check if date is in range
      if (rowDate >= start && rowDate <= end) {
        const tasks = []
        
        // Extract tasks (Task 1-3 only, skip empty ones)
        for (let taskNum = 1; taskNum <= 3; taskNum++) {
          const taskIndex = headers.indexOf(`Task ${taskNum}`)
          const completionIndex = headers.indexOf(`Task ${taskNum} Completion`)
          
          if (taskIndex !== -1 && rows[i][taskIndex] && rows[i][taskIndex].trim()) {
            tasks.push({
              id: taskNum,
              task: rows[i][taskIndex],
              completed: rows[i][completionIndex]?.toLowerCase() === 'true' || rows[i][completionIndex] === '1',
              rowIndex: i + 1,
              date: rowDateStr,
            })
          }
        }
        
        // Only add date if it has tasks
        if (tasks.length > 0) {
          tasksByDate[rowDateStr] = tasks
        }
      }
    }
    
    console.log('📋 Returning tasks for', Object.keys(tasksByDate).length, 'dates')
    return tasksByDate
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

export async function updateTaskCompletion(email: string, taskId: number, completed: boolean, taskDate?: string) {
  try {
    console.log('📝 updateTaskCompletion called:', { email, taskId, completed, taskDate })
    
    const sheets = getSheetsClient()
    
    // Get user's timezone
    const userTargets = await getUserTargets(email)
    if (!userTargets) {
      console.log('❌ Could not get user targets')
      return false
    }
    
    // Determine which date to update
    let targetDateStr: string
    if (taskDate) {
      // Date provided - use it directly (should be in DD/MM/YYYY format)
      targetDateStr = taskDate
    } else {
      // No date provided - use today's date
      const { utcOffsetToIANA } = await import('./timezone')
      const { toZonedTime } = await import('date-fns-tz')
      const { format } = await import('date-fns')
      
      const ianaTimezone = utcOffsetToIANA(userTargets.timezone)
      const now = new Date()
      const userTime = toZonedTime(now, ianaTimezone)
      targetDateStr = format(userTime, 'd/M/yyyy')
    }
    
    console.log('📅 Target date:', targetDateStr)
    
    // First, find the row for the target date
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 2) {
      console.log('⚠️ No data rows in Logs sheet')
      return false
    }

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    const dateIndex = headers.indexOf('Date')
    const completionIndex = headers.indexOf(`Task ${taskId} Completion`)
    
    console.log('📍 Column indices:', { emailIndex, dateIndex, completionIndex })
    
    if (completionIndex === -1) {
      console.log('❌ Task completion column not found')
      return false
    }

    // Find the row for this user and date
    let targetRowIndex = -1
    for (let i = rows.length - 1; i >= 1; i--) {
      const rowEmail = rows[i][emailIndex]?.toLowerCase().trim()
      const rowDate = rows[i][dateIndex]
      
      if (rowEmail === email.toLowerCase() && rowDate === targetDateStr) {
        targetRowIndex = i
        console.log('✅ Found target row:', targetRowIndex, 'with date:', rowDate)
        break
      }
    }

    if (targetRowIndex === -1) {
      console.log('⚠️ No log entry for date:', targetDateStr)
      return false
    }

    // Update the completion status for the target row
    const columnLetter = String.fromCharCode(65 + completionIndex) // Convert index to column letter
    const range = `Logs!${columnLetter}${targetRowIndex + 1}` // +1 because sheets are 1-indexed

    console.log('📝 Updating range:', range, 'with value:', completed ? 'TRUE' : 'FALSE')

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[completed ? 'TRUE' : 'FALSE']],
      },
    })

    console.log('✅ Task completion updated successfully')
    return true
  } catch (error) {
    console.error('❌ Error updating task completion:', error)
    return false
  }
}

export async function updateTaskText(email: string, taskId: number, taskText: string) {
  try {
    console.log('📝 updateTaskText called:', { email, taskId, taskText })
    
    const sheets = getSheetsClient()
    
    // Get user's timezone to determine "today"
    const userTargets = await getUserTargets(email)
    if (!userTargets) {
      console.log('❌ Could not get user targets')
      return false
    }
    
    // Calculate today's date in user's timezone
    const { utcOffsetToIANA } = await import('./timezone')
    const { toZonedTime } = await import('date-fns-tz')
    const { format } = await import('date-fns')
    
    const ianaTimezone = utcOffsetToIANA(userTargets.timezone)
    const now = new Date()
    const userTime = toZonedTime(now, ianaTimezone)
    const todayDateStr = format(userTime, 'd/M/yyyy') // DD/MM/YYYY format for Google Sheets
    
    console.log('📅 Today in user timezone:', todayDateStr)
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 2) {
      console.log('⚠️ No data rows in Logs sheet')
      return false
    }

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    const dateIndex = headers.indexOf('Date')
    const taskIndex = headers.indexOf(`Task ${taskId}`)
    
    if (taskIndex === -1) {
      console.log('❌ Task column not found')
      return false
    }
    
    // Find today's row for this user
    let todayRowIndex = -1
    for (let i = rows.length - 1; i >= 1; i--) {
      const rowEmail = rows[i][emailIndex]?.toLowerCase().trim()
      const rowDate = rows[i][dateIndex]
      
      if (rowEmail === email.toLowerCase() && rowDate === todayDateStr) {
        todayRowIndex = i
        console.log('✅ Found today\'s row:', todayRowIndex + 1)
        break
      }
    }

    if (todayRowIndex === -1) {
      console.log('⚠️ No log entry for today')
      return false
    }

    // Update the task text AND set completion to FALSE if task is not empty
    const taskColumnLetter = String.fromCharCode(65 + taskIndex) // Convert index to column letter
    const taskRange = `Logs!${taskColumnLetter}${todayRowIndex + 1}` // +1 because sheets are 1-indexed

    console.log('📝 Updating range:', taskRange, 'with text:', taskText)

    // Prepare batch update to set both task text and completion status
    const completionIndex = headers.indexOf(`Task ${taskId} Completion`)
    const updates: any[] = [
      {
        range: taskRange,
        values: [[taskText]],
      }
    ]

    // If task has text and completion column exists, set completion to FALSE
    if (taskText.trim().length > 0 && completionIndex !== -1) {
      const completionColumnLetter = String.fromCharCode(65 + completionIndex)
      const completionRange = `Logs!${completionColumnLetter}${todayRowIndex + 1}`
      updates.push({
        range: completionRange,
        values: [['FALSE']],
      })
      console.log('📝 Also setting completion to FALSE at:', completionRange)
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    })

    console.log('✅ Task text updated successfully (and completion set to FALSE)')
    return true
  } catch (error) {
    console.error('❌ Error updating task text:', error)
    return false
  }
}

export async function updateTodayLog(email: string, logData: Record<string, string | number>) {
  try {
    console.log('📝 updateTodayLog called:', { email, logData })
    
    const sheets = getSheetsClient()
    
    // Get user's timezone to determine "today"
    const userTargets = await getUserTargets(email)
    if (!userTargets) {
      console.log('❌ Could not get user targets')
      return false
    }
    
    // Calculate today's date in user's timezone
    const { utcOffsetToIANA } = await import('./timezone')
    const { toZonedTime } = await import('date-fns-tz')
    const { format } = await import('date-fns')
    
    const ianaTimezone = utcOffsetToIANA(userTargets.timezone)
    const now = new Date()
    const userTime = toZonedTime(now, ianaTimezone)
    const todayDateStr = format(userTime, 'd/M/yyyy') // DD/MM/YYYY format for Google Sheets
    
    console.log('📅 Today in user timezone:', todayDateStr)
    
    // Read entire Logs sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 1) {
      console.log('❌ No header row in Logs sheet')
      return false
    }

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    const dateIndex = headers.indexOf('Date')
    
    // Find today's row for this user
    let todayRowIndex = -1
    for (let i = rows.length - 1; i >= 1; i--) {
      const rowEmail = rows[i][emailIndex]?.toLowerCase().trim()
      const rowDate = rows[i][dateIndex]
      
      if (rowEmail === email.toLowerCase() && rowDate === todayDateStr) {
        todayRowIndex = i
        console.log('✅ Found today\'s row:', todayRowIndex, 'with date:', rowDate)
        break
      }
    }

    // If no row exists for today, create one
    if (todayRowIndex === -1) {
      console.log('📝 Creating new row for today')
      
      // Prepare new row data
      const newRow = new Array(headers.length).fill('')
      newRow[emailIndex] = email
      newRow[dateIndex] = todayDateStr
      
      // Fill in the log data
      Object.keys(logData).forEach(key => {
        const colIndex = headers.indexOf(key)
        if (colIndex !== -1) {
          newRow[colIndex] = String(logData[key])
        }
      })
      
      // Append the new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Logs!A:Z',
        valueInputOption: 'RAW',
        requestBody: {
          values: [newRow],
        },
      })
      
      console.log('✅ New log row created for today')
      return true
    }

    // Update existing row
    console.log('📝 Updating existing row for today')
    
    // Build update requests for each field
    const updates: any[] = []
    
    Object.keys(logData).forEach(key => {
      const colIndex = headers.indexOf(key)
      if (colIndex !== -1) {
        const columnLetter = String.fromCharCode(65 + colIndex)
        const range = `Logs!${columnLetter}${todayRowIndex + 1}`
        updates.push({
          range,
          values: [[String(logData[key])]],
        })
      }
    })
    
    // Batch update all fields
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates,
        },
      })
      
      console.log('✅ Log updated successfully:', updates.length, 'fields')
    }
    
    return true
  } catch (error) {
    console.error('❌ Error updating today\'s log:', error)
    return false
  }
}

