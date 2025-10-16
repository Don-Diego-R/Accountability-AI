'use client'

import { useState, useEffect } from 'react'
import { Circle, CheckCircle2, Edit2, Save, X } from 'lucide-react'

interface Task {
  id: number
  task: string
  completed: boolean
  rowIndex?: number
  date?: string
}

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editedText, setEditedText] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(taskId: number, completed: boolean) {
    // Optimistic update
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ))
    
    try {
      console.log('🔄 Updating task:', { taskId, completed })
      
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed }),
      })

      if (!res.ok) {
        console.error('❌ Failed to update task:', await res.text())
        // Revert on error
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed: !completed } : task
        ))
      } else {
        console.log('✅ Task updated successfully')
      }
    } catch (error) {
      console.error('❌ Error updating task:', error)
      // Revert on error
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ))
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
      // Allow clearing a task
      return
    }

    setSaving(true)
    // Optimistic update
    const previousText = task.task
    setTasks(tasks.map(t => 
      t.id === task.id ? { ...t, task: editedText } : t
    ))
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
        setTasks(tasks.map(t => 
          t.id === task.id ? { ...t, task: previousText } : t
        ))
        alert('Failed to update task. Please try again.')
      } else {
        console.log('✅ Task text updated successfully')
        // Refresh tasks to get updated list
        await fetchTasks()
      }
    } catch (error) {
      console.error('❌ Error updating task text:', error)
      // Revert on error
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, task: previousText } : t
      ))
      alert('Failed to update task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function saveNewTask(taskId: number, taskText: string) {
    if (taskText.trim().length === 0) {
      return // Allow empty tasks, just don't save
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
        // Refresh tasks to get updated list
        await fetchTasks()
      }
    } catch (error) {
      console.error('❌ Error creating task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  // Always show 3 task slots, create placeholder objects for missing tasks
  const allTaskSlots = [1, 2, 3].map(id => {
    const existingTask = tasks.find(t => t.id === id)
    return existingTask || { id, task: '', completed: false }
  })

  const openTasks = allTaskSlots.filter(t => !t.completed)
  const completedTasks = allTaskSlots.filter(t => t.completed)
  const hasAnyTasks = tasks.length > 0

  return (
    <div className="space-y-6">
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
          {openTasks.map(task => {
            const isEmpty = !task.task || task.task.trim().length === 0
            
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group"
              >
                {!isEmpty && (
                  <Circle 
                    className="w-6 h-6 text-gray-400 flex-shrink-0 cursor-pointer" 
                    onClick={() => toggleTask(task.id, true)}
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
      </div>

      {completedTasks.filter(t => t.task && t.task.trim().length > 0).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Tasks</h2>
          <ul className="space-y-3">
            {completedTasks.filter(t => t.task && t.task.trim().length > 0).map(task => (
              <li
                key={task.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer opacity-60"
                onClick={() => toggleTask(task.id, false)}
              >
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-gray-900 line-through">{task.task}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
