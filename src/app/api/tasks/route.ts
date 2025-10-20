import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTasks, updateTaskCompletion, updateTaskText } from '@/lib/sheets'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get date range from query parameters
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const tasks = await getTasks(session.user.email, startDate || undefined, endDate || undefined)
  
  return NextResponse.json(tasks)
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { taskId, completed, taskDate } = body

  if (typeof taskId !== 'number' || typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const success = await updateTaskCompletion(session.user.email, taskId, completed, taskDate)
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { taskId, taskText } = body

  if (typeof taskId !== 'number' || typeof taskText !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Allow empty task text (user might want to clear a task)
  const success = await updateTaskText(session.user.email, taskId, taskText)
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to update task text' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

