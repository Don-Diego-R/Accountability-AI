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

export async function getTasks(email: string) {
  try {
    const sheets = getSheetsClient()
    
    // Read tasks from Logs sheet (Task columns)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 2) return []

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    
    // Find user's most recent row
    const userRows = rows
      .slice(1)
      .filter(row => row[emailIndex]?.toLowerCase().trim() === email.toLowerCase())
    
    if (userRows.length === 0) return []
    
    const latestRow = userRows[userRows.length - 1]
    const tasks = []

    // Extract tasks (Task 1-3 only, as per requirements)
    for (let i = 1; i <= 3; i++) {
      const taskIndex = headers.indexOf(`Task ${i}`)
      const completionIndex = headers.indexOf(`Task ${i} Completion`)
      
      if (taskIndex !== -1 && latestRow[taskIndex]) {
        tasks.push({
          id: i,
          task: latestRow[taskIndex],
          completed: latestRow[completionIndex]?.toLowerCase() === 'true' || latestRow[completionIndex] === '1',
        })
      }
    }

    return tasks
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

export async function updateTaskCompletion(email: string, taskId: number, completed: boolean) {
  try {
    console.log('📝 updateTaskCompletion called:', { email, taskId, completed })
    
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
    
    // First, find today's row or the user's row
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

    if (todayRowIndex === -1) {
      console.log('⚠️ No log entry for today. User needs to create today\'s log first.')
      // TODO: Could optionally create a new row here, but for now we require a log entry to exist
      return false
    }

    // Update the completion status for today's row
    const columnLetter = String.fromCharCode(65 + completionIndex) // Convert index to column letter
    const range = `Logs!${columnLetter}${todayRowIndex + 1}` // +1 because sheets are 1-indexed

    console.log('📝 Updating range:', range, 'with value:', completed ? 'TRUE' : 'FALSE')

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[completed ? 'TRUE' : 'FALSE']],
      },
    })

    console.log('✅ Task completion updated successfully in today\'s log')
    return true
  } catch (error) {
    console.error('❌ Error updating task completion:', error)
    return false
  }
}
