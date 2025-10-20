'use client'

import { useState, useEffect } from 'react'
import { Circle, CheckCircle2, Edit2, Save, X } from 'lucide-react'
import { format, parse } from 'date-fns'

interface Task {
  id: number
  task: string
  completed: boolean
  rowIndex?: number
  date?: string
}

interface TasksByDate {
  [date: string]: Task[]
}

interface TasksTabProps {
  startDate?: string
  endDate?: string
}

export default function TasksTab({ startDate, endDate }: TasksTabProps) {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editedText, setEditedText] = useState('')
  const [todayDate, setTodayDate] = useState<string>('')

  useEffect(() => {
    fetchTasks()
  }, [startDate, endDate])

  async function fetchTasks() {
    setLoading(true)
    try {
      let url = '/api/tasks'
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`
      }
      
      const res = await fetch(url)
      const data = await res.json()
      
      // Data could be an array (legacy, today only) or object (date range)
      if (Array.isArray(data)) {
        // Legacy format - tasks for today only
        const today = new Date()
        const todayStr = format(today, 'd/M/yyyy')
        setTodayDate(todayStr)
        setTasksByDate({ [todayStr]: data })
      } else {
        // New format - tasks grouped by date
        setTasksByDate(data)
        // Set today's date
        const today = new Date()
        const todayStr = format(today, 'd/M/yyyy')
        setTodayDate(todayStr)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(taskId: number, completed: boolean, taskDate: string) {
    // Optimistic update
    setTasksByDate(prev => ({
      ...prev,
      [taskDate]: prev[taskDate].map(task => 
        task.id === taskId ? { ...task, completed } : task
      )
    }))
    
    try {
      console.log('🔄 Updating task:', { taskId, completed, taskDate })
      
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed, taskDate }),
      })

      if (!res.ok) {
        console.error('❌ Failed to update task:', await res.text())
        // Revert on error
        setTasksByDate(prev => ({
          ...prev,
          [taskDate]: prev[taskDate].map(task => 
            task.id === taskId ? { ...task, completed: !completed } : task
          )
        }))
      } else {
        console.log('✅ Task updated successfully')
      }
    } catch (error) {
      console.error('❌ Error updating task:', error)
      // Revert on error
      setTasksByDate(prev => ({
        ...prev,
        [taskDate]: prev[taskDate].map(task => 
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      }))
    }
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id)
    setEditedText(task.task)
  }

  function cancelEditing() {
    setEditingTaskId(null)
    setEditedText('')
  }

  async function saveTaskText(task: Task) {
    if (editedText.trim().length === 0) {
      return
    }

    setSaving(true)
    // Optimistic update
    const previousText = task.task
    setTasksByDate(prev => ({
      ...prev,
      [task.date!]: prev[task.date!].map(t => 
        t.id === task.id ? { ...t, task: editedText } : t
      )
    }))
    setEditingTaskId(null)

    try {
      console.log('🔄 Updating task text:', { taskId: task.id, taskText: editedText })
      
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: task.id, 
          taskText: editedText
        }),
      })

      if (!res.ok) {
        console.error('❌ Failed to update task text:', await res.text())
        // Revert on error
        setTasksByDate(prev => ({
          ...prev,
          [task.date!]: prev[task.date!].map(t => 
            t.id === task.id ? { ...t, task: previousText } : t
          )
        }))
        alert('Failed to update task. Please try again.')
      } else {
        console.log('✅ Task text updated successfully')
        await fetchTasks()
      }
    } catch (error) {
      console.error('❌ Error updating task text:', error)
      // Revert on error
      setTasksByDate(prev => ({
        ...prev,
        [task.date!]: prev[task.date!].map(t => 
          t.id === task.id ? { ...t, task: previousText } : t
        )
      }))
      alert('Failed to update task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function saveNewTask(taskId: number, taskText: string) {
    if (taskText.trim().length === 0) {
      return
    }

    setSaving(true)
    try {
      console.log('🔄 Creating new task:', { taskId, taskText })
      
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId, 
          taskText: taskText.trim()
        }),
      })

      if (!res.ok) {
        console.error('❌ Failed to create task:', await res.text())
        alert('Failed to create task. Please try again.')
      } else {
        console.log('✅ Task created successfully')
        await fetchTasks()
      }
    } catch (error) {
      console.error('❌ Error creating task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Helper to parse date string (DD/MM/YYYY) and format it nicely
  function formatDateHeader(dateStr: string): string {
    try {
      const parts = dateStr.split('/')
      if (parts.length !== 3) return dateStr
      
      const day = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1
      const year = parseInt(parts[2])
      const date = new Date(year, month, day)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      date.setHours(0, 0, 0, 0)
      
      if (date.getTime() === today.getTime()) {
        return "Today's Tasks"
      }
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (date.getTime() === yesterday.getTime()) {
        return `Yesterday - ${format(date, 'MMM d, yyyy')}`
      }
      
      return format(date, 'EEEE, MMM d, yyyy')
    } catch (e) {
      return dateStr
    }
  }

  // Helper to check if a date is today
  function isToday(dateStr: string): boolean {
    return dateStr === todayDate
  }

  // Sort dates in reverse chronological order (today first)
  function getSortedDates(): string[] {
    const dates = Object.keys(tasksByDate)
    return dates.sort((a, b) => {
      try {
        const partsA = a.split('/')
        const partsB = b.split('/')
        
        const dateA = new Date(parseInt(partsA[2]), parseInt(partsA[1]) - 1, parseInt(partsA[0]))
        const dateB = new Date(parseInt(partsB[2]), parseInt(partsB[1]) - 1, parseInt(partsB[0]))
        
        return dateB.getTime() - dateA.getTime() // Descending order
      } catch (e) {
        return 0
      }
    })
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const sortedDates = getSortedDates()
  const hasAnyTasks = sortedDates.some(date => tasksByDate[date] && tasksByDate[date].length > 0)

  // For today, we need to show all 3 slots even if empty
  const todayTasks = todayDate && tasksByDate[todayDate] ? tasksByDate[todayDate] : []
  const allTodaySlots = [1, 2, 3].map(id => {
    const existingTask = todayTasks.find(t => t.id === id)
    return existingTask || { id, task: '', completed: false, date: todayDate }
  })
  const todayOpenTasks = allTodaySlots.filter(t => !t.completed)
  const todayCompletedTasks = allTodaySlots.filter(t => t.completed && t.task && t.task.trim().length > 0)

  return (
    <div className="space-y-4">
      {/* Today's Tasks - Full Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Today&apos;s Tasks</h2>
          {saving && (
            <div className="flex items-center gap-2 text-blue-600">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Saving...</span>
            </div>
          )}
        </div>
        {!hasAnyTasks && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">📝 Fill in your tasks for today</p>
          </div>
        )}
        <ul className="space-y-3">
          {todayOpenTasks.map(task => {
            const isEmpty = !task.task || task.task.trim().length === 0
            
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group"
              >
                {!isEmpty && (
                  <Circle 
                    className="w-6 h-6 text-gray-400 flex-shrink-0 cursor-pointer" 
                    onClick={() => toggleTask(task.id, true, todayDate)}
                  />
                )}
                {isEmpty && (
                  <span className="w-6 h-6 flex-shrink-0 text-gray-300 text-sm font-bold flex items-center justify-center">
                    {task.id}
                  </span>
                )}
                {editingTaskId === task.id ? (
                  <>
                    <input
                      type="text"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (isEmpty) {
                            saveNewTask(task.id, editedText)
                          } else {
                            saveTaskText(task)
                          }
                        }
                        if (e.key === 'Escape') cancelEditing()
                      }}
                    />
                    <button
                      onClick={() => {
                        if (isEmpty) {
                          saveNewTask(task.id, editedText)
                        } else {
                          saveTaskText(task)
                        }
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Save"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 ${isEmpty ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                      {isEmpty ? 'Click to add task...' : task.task}
                    </span>
                    <button
                      onClick={() => startEditing(task)}
                      className={`p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-opacity ${isEmpty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      title={isEmpty ? 'Add task' : 'Edit task'}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>

        {todayCompletedTasks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Completed</h3>
            <ul className="space-y-2">
              {todayCompletedTasks.map(task => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer opacity-60"
                  onClick={() => toggleTask(task.id, false, todayDate)}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-900 line-through text-sm">{task.task}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Historical Tasks - Compact Cards */}
      {sortedDates.filter(date => date !== todayDate && tasksByDate[date] && tasksByDate[date].length > 0).map(date => {
        const tasks = tasksByDate[date]
        const openTasks = tasks.filter(t => !t.completed)
        const completedTasks = tasks.filter(t => t.completed)

        return (
          <div key={date} className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{formatDateHeader(date)}</h3>
            
            {/* Open tasks */}
            {openTasks.length > 0 && (
              <ul className="space-y-2 mb-2">
                {openTasks.map(task => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => toggleTask(task.id, true, date)}
                  >
                    <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-900">{task.task}</span>
                  </li>
                ))}
              </ul>
            )}
            
            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <ul className="space-y-2">
                {completedTasks.map(task => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer opacity-60"
                    onClick={() => toggleTask(task.id, false, date)}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 line-through">{task.task}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}

      {sortedDates.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          <p>No tasks found for the selected date range.</p>
        </div>
      )}
    </div>
  )
}
