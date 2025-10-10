'use client'

import { useState, useEffect } from 'react'
import { Circle, CheckCircle2 } from 'lucide-react'

interface Task {
  id: number
  task: string
  completed: boolean
}

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

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
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => toggleTask(task.id, true)}
              >
                <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <span className="text-gray-900">{task.task}</span>
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
