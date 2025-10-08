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
    
    // Find user's row
    const userRow = rows.find((row, idx) => 
      idx > 0 && row[emailIndex]?.toLowerCase().trim() === email.toLowerCase()
    )

    if (!userRow) return null

    // Map to object
    const userData: any = {}
    headers.forEach((header, idx) => {
      userData[header] = userRow[idx] || null
    })

    return {
      industry: userData['Agent Industry'],
      conversationsPerDay: parseInt(userData['Target number of conversations (connects) / day']) || 0,
      meetingsScheduledPerDay: parseInt(userData['Target number of sales meetings scheduled / day']) || 0,
      meetingsHeldPerDay: parseInt(userData['Target number of sales meetings run / day']) || 0,
      listingsPerMonth: parseInt(userData['Target number of listings / month']) || 0,
      appraisalsPerWeek: parseInt(userData['Target number of in-person appraisals / week']) || 0,
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
    const sheets = getSheetsClient()
    
    // Read entire Logs sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 2) return []

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    const dateIndex = headers.indexOf('Date')
    
    // Filter logs for this user within date range
    const logs = rows
      .slice(1)
      .filter(row => {
        const rowEmail = row[emailIndex]?.toLowerCase().trim()
        const rowDate = row[dateIndex]
        
        if (rowEmail !== email.toLowerCase()) return false
        if (!rowDate) return false
        
        return rowDate >= startDate && rowDate <= endDate
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
    const sheets = getSheetsClient()
    
    // First, find the user's row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Logs!A:Z',
    })

    const rows = response.data.values || []
    if (rows.length < 2) return false

    const headers = rows[0]
    const emailIndex = headers.indexOf('Agent Email')
    const completionIndex = headers.indexOf(`Task ${taskId} Completion`)
    
    if (completionIndex === -1) return false

    // Find user's most recent row
    let userRowIndex = -1
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i][emailIndex]?.toLowerCase().trim() === email.toLowerCase()) {
        userRowIndex = i
        break
      }
    }

    if (userRowIndex === -1) return false

    // Update the completion status
    const columnLetter = String.fromCharCode(65 + completionIndex) // Convert index to column letter
    const range = `Logs!${columnLetter}${userRowIndex + 1}` // +1 because sheets are 1-indexed

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[completed ? 'TRUE' : 'FALSE']],
      },
    })

    return true
  } catch (error) {
    console.error('Error updating task completion:', error)
    return false
  }
}
