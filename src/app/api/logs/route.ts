import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDailyLogs, updateTodayLog } from '@/lib/sheets'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 })
  }

  const logs = await getDailyLogs(session.user.email, startDate, endDate)
  
  return NextResponse.json(logs)
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { logData } = body

  if (!logData || typeof logData !== 'object') {
    return NextResponse.json({ error: 'Invalid log data' }, { status: 400 })
  }

  const success = await updateTodayLog(session.user.email, logData)
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
