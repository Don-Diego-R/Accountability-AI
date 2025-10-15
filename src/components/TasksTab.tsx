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
      alert('Task text cannot be empty')
      return
    }

    if (!task.rowIndex) {
      console.error('❌ Task missing rowIndex')
      return
    }

    // Optimistic update
    const previousText = task.task
    setTasks(tasks.map(t => 
      t.id === task.id ? { ...t, task: editedText } : t
    ))
    setEditingTaskId(null)

    try {
      console.log('🔄 Updating task text:', { taskId: task.id, taskText: editedText, rowIndex: task.rowIndex })
      
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskId: task.id, 
          taskText: editedText,
          rowIndex: task.rowIndex
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
      }
    } catch (error) {
      console.error('❌ Error updating task text:', error)
      // Revert on error
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, task: previousText } : t
      ))
      alert('Failed to update task. Please try again.')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const openTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Open Tasks</h2>
        {openTasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No open tasks. Great job! 🎉</p>
        ) : (
          <ul className="space-y-3">
            {openTasks.map(task => (
              <li
                key={task.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group"
              >
                <Circle 
                  className="w-6 h-6 text-gray-400 flex-shrink-0 cursor-pointer" 
                  onClick={() => toggleTask(task.id, true)}
                />
                {editingTaskId === task.id ? (
                  <>
                    <input
                      type="text"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTaskText(task)
                        if (e.key === 'Escape') cancelEditing()
                      }}
                    />
                    <button
                      onClick={() => saveTaskText(task)}
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
                    <span className="flex-1 text-gray-900">{task.task}</span>
                    <button
                      onClick={() => startEditing(task)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit task"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Completed Tasks</h2>
          <ul className="space-y-3">
            {completedTasks.map(task => (
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
