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
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <div className="text-4xl font-bold text-gray-900 mb-1">{actual}</div>
      <div className="text-sm text-gray-600 mb-3">Target · {target}</div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [targetsRes, logsRes] = await Promise.all([
          fetch('/api/targets'),
          fetch(`/api/logs?startDate=${startDate}&endDate=${endDate}`),
        ])

        const targetsData = await targetsRes.json()
        const logsData = await logsRes.json()

        setTargets(targetsData)
        setLogs(logsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!targets) {
    return <div className="text-center py-12">No data available</div>
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

  // Calculate targets for the period
  const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1
  const targetConversations = targets.conversationsPerDay * days
  const targetMeetingsScheduled = targets.meetingsScheduledPerDay * days
  const targetMeetingsHeld = targets.meetingsHeldPerDay * days
  const targetListings = targets.listingsPerMonth // Assuming monthly target

  // Determine colors based on percentage
  const getColor = (actual: number, target: number): 'green' | 'amber' | 'red' => {
    if (target === 0) return 'green'
    const percentage = (actual / target) * 100
    if (percentage >= 100) return 'green'
    if (percentage >= 60) return 'amber'
    return 'red'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <KPICard
        title="Conversations"
        actual={totalConversations}
        target={targetConversations}
        color={getColor(totalConversations, targetConversations)}
      />
      <KPICard
        title="Meetings Scheduled"
        actual={totalMeetingsScheduled}
        target={targetMeetingsScheduled}
        color={getColor(totalMeetingsScheduled, targetMeetingsScheduled)}
      />
      <KPICard
        title="Meetings Held"
        actual={totalMeetingsHeld}
        target={targetMeetingsHeld}
        color={getColor(totalMeetingsHeld, targetMeetingsHeld)}
      />
      <KPICard
        title="Listings Won"
        actual={totalListings}
        target={targetListings}
        color={getColor(totalListings, targetListings)}
      />
    </div>
  )
}
