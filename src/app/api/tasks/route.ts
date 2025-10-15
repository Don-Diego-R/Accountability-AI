import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTasks, updateTaskCompletion, updateTaskText } from '@/lib/sheets'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tasks = await getTasks(session.user.email)
  
  return NextResponse.json(tasks)
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { taskId, completed } = body

  if (typeof taskId !== 'number' || typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const success = await updateTaskCompletion(session.user.email, taskId, completed)
  
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
  const { taskId, taskText, rowIndex } = body

  if (typeof taskId !== 'number' || typeof taskText !== 'string' || typeof rowIndex !== 'number') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Validate task text is not empty
  if (taskText.trim().length === 0) {
    return NextResponse.json({ error: 'Task text cannot be empty' }, { status: 400 })
  }

  const success = await updateTaskText(session.user.email, taskId, taskText, rowIndex)
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to update task text' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

