'use client'

import { useState, useEffect } from 'react'
import { differenceInDays } from 'date-fns'

interface KPICardProps {
  title: string
  actual: number
  target: number
  color: 'green' | 'amber' | 'red'
}

function KPICard({ title, actual, target, color }: KPICardProps) {
  const percentage = target > 0 ? (actual / target) * 100 : 0
  
  const colorClasses = {
    green: 'bg-emerald-500',
    amber: 'bg-orange-500',
    red: 'bg-rose-500',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="text-4xl font-bold text-gray-900 mb-1">{actual}</div>
      <div className="text-sm text-gray-500 mb-4">Target is: {target}</div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  )
}

interface HomeTabProps {
  startDate: string
  endDate: string
}

export default function HomeTab({ startDate, endDate }: HomeTabProps) {
  const [targets, setTargets] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [targetsRes, logsRes, tasksRes] = await Promise.all([
          fetch('/api/targets'),
          fetch(`/api/logs?startDate=${startDate}&endDate=${endDate}`),
          fetch('/api/tasks'),
        ])

        const targetsData = await targetsRes.json()
        const logsData = await logsRes.json()
        const tasksData = await tasksRes.json()

        setTargets(targetsData)
        // Ensure logsData is always an array
        setLogs(Array.isArray(logsData) ? logsData : [])
        setTasks(Array.isArray(tasksData) ? tasksData : [])
      } catch (error) {
        console.error('Error fetching data:', error)
        setLogs([]) // Set empty array on error
        setTasks([])
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have valid dates
    if (startDate && endDate) {
      fetchData()
    }
  }, [startDate, endDate])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!targets) {
    return <div className="text-center py-12">No data available</div>
  }

  // Helper function to check if user has a target set for this metric (from Users Table)
  // This determines which cards to show, regardless of whether there's data in logs yet
  const shouldShowMetric = (metricType: string): boolean => {
    switch (metricType) {
      case 'conversations':
        return targets.conversationsPerDay > 0
      case 'meetingsScheduled':
        return targets.meetingsScheduledPerDay > 0
      case 'meetingsHeld':
        return targets.meetingsHeldPerDay > 0
      case 'listings':
        return targets.listingsPerMonth > 0
      case 'appraisals':
        return targets.appraisalsPerWeek > 0
      case 'listingPresentations':
        return targets.listingPresentationsPerWeek > 0
      case 'offers':
        return targets.offersPerDay > 0
      case 'groupPresentations':
        return targets.groupPresentationsPerWeek > 0
      default:
        return false
    }
  }

  // Calculate totals from logs
  const totalConversations = logs.reduce((sum, log) => {
    const val = parseInt(log['Number of conversations (connects) today']) || 0
    return sum + val
  }, 0)

  const totalMeetingsScheduled = logs.reduce((sum, log) => {
    const val = parseInt(log['Number of sales meetings scheduled today']) || 0
    return sum + val
  }, 0)

  const totalMeetingsHeld = logs.reduce((sum, log) => {
    const val = parseInt(log['Number of sales meetings run today']) || 0
    return sum + val
  }, 0)

  const totalListings = logs.reduce((sum, log) => {
    const val = parseInt(log['Number of listings today']) || 0
    return sum + val
  }, 0)

  const totalAppraisals = logs.reduce((sum, log) => {
    const val = parseInt(log['Number of in-person appraisals today']) || 0
    return sum + val
  }, 0)

  const totalListingPresentations = logs.reduce((sum, log) => {
    const val = parseInt(log['Number of listing presentations today']) || 0
    return sum + val
  }, 0)

  const totalOffers = logs.reduce((sum, log) => {
    const val = parseInt(log['Number of offers presented today']) || 0
    return sum + val
  }, 0)

  const totalGroupPresentations = logs.reduce((sum, log) => {
    const val = parseInt(log['Number of group sales presentations today']) || 0
    return sum + val
  }, 0)

  // Calculate targets for the period
  // For monthly view, use ~22 working days; for custom ranges, count actual days
  const totalDays = differenceInDays(new Date(endDate), new Date(startDate)) + 1
  
  // If viewing a full month (28+ days), assume 22 working days
  // Otherwise use the actual day count for custom ranges
  const workingDays = totalDays >= 28 ? 22 : totalDays
  const weeks = totalDays / 7 // For weekly targets
  
  const targetConversations = targets.conversationsPerDay * workingDays
  const targetMeetingsScheduled = targets.meetingsScheduledPerDay * workingDays
  const targetMeetingsHeld = targets.meetingsHeldPerDay * workingDays
  const targetListings = targets.listingsPerMonth // Monthly target (not prorated for now)
  const targetAppraisals = Math.ceil(targets.appraisalsPerWeek * weeks)
  const targetListingPresentations = Math.ceil(targets.listingPresentationsPerWeek * weeks)
  const targetOffers = targets.offersPerDay * workingDays
  const targetGroupPresentations = Math.ceil(targets.groupPresentationsPerWeek * weeks)

  // Determine colors based on percentage
  const getColor = (actual: number, target: number): 'green' | 'amber' | 'red' => {
    if (target === 0) return 'green'
    const percentage = (actual / target) * 100
    if (percentage >= 100) return 'green'
    if (percentage >= 60) return 'amber'
    return 'red'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shouldShowMetric('conversations') && (
          <KPICard
            title="Conversations"
            actual={totalConversations}
            target={targetConversations}
            color={getColor(totalConversations, targetConversations)}
          />
        )}
        {shouldShowMetric('meetingsScheduled') && (
          <KPICard
            title="Meetings Scheduled"
            actual={totalMeetingsScheduled}
            target={targetMeetingsScheduled}
            color={getColor(totalMeetingsScheduled, targetMeetingsScheduled)}
          />
        )}
        {shouldShowMetric('meetingsHeld') && (
          <KPICard
            title="Meetings Held"
            actual={totalMeetingsHeld}
            target={targetMeetingsHeld}
            color={getColor(totalMeetingsHeld, targetMeetingsHeld)}
          />
        )}
        {shouldShowMetric('listings') && (
          <KPICard
            title="Listings Won"
            actual={totalListings}
            target={targetListings}
            color={getColor(totalListings, targetListings)}
          />
        )}
        {shouldShowMetric('appraisals') && (
          <KPICard
            title="Appraisals"
            actual={totalAppraisals}
            target={targetAppraisals}
            color={getColor(totalAppraisals, targetAppraisals)}
          />
        )}
        {shouldShowMetric('listingPresentations') && (
          <KPICard
            title="Listing Presentations"
            actual={totalListingPresentations}
            target={targetListingPresentations}
            color={getColor(totalListingPresentations, targetListingPresentations)}
          />
        )}
        {shouldShowMetric('offers') && (
          <KPICard
            title="Offers Presented"
            actual={totalOffers}
            target={targetOffers}
            color={getColor(totalOffers, targetOffers)}
          />
        )}
        {shouldShowMetric('groupPresentations') && (
          <KPICard
            title="Group Presentations"
            actual={totalGroupPresentations}
            target={targetGroupPresentations}
            color={getColor(totalGroupPresentations, targetGroupPresentations)}
          />
        )}
      </div>

      {/* Tasks Section */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">OPEN TASKS</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <span className="text-gray-800 font-medium">{task.task}</span>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={async (e) => {
                    const newCompleted = e.target.checked
                    // Optimistic update
                    setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t))
                    
                    // Update on server
                    try {
                      await fetch('/api/tasks', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ taskId: task.id, completed: newCompleted })
                      })
                    } catch (error) {
                      console.error('Failed to update task:', error)
                      // Revert on error
                      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !newCompleted } : t))
                    }
                  }}
                  className="w-6 h-6 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
