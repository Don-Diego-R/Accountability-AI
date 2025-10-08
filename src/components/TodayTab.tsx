'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function TodayTab() {
  const [targets, setTargets] = useState<any>(null)
  const [todayLog, setTodayLog] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const today = format(new Date(), 'yyyy-MM-dd')
        const [targetsRes, logsRes] = await Promise.all([
          fetch('/api/targets'),
          fetch(`/api/logs?startDate=${today}&endDate=${today}`),
        ])

        const targetsData = await targetsRes.json()
        const logsData = await logsRes.json()

        setTargets(targetsData)
        setTodayLog(logsData.length > 0 ? logsData[0] : null)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!targets) {
    return <div className="text-center py-12">No data available</div>
  }

  const conversations = todayLog ? parseInt(todayLog['Number of conversations (connects) today']) || 0 : 0
  const meetingsScheduled = todayLog ? parseInt(todayLog['Number of sales meetings scheduled today']) || 0 : 0
  const meetingsHeld = todayLog ? parseInt(todayLog['Number of sales meetings run today']) || 0 : 0
  const listings = todayLog ? parseInt(todayLog['Number of listings today']) || 0 : 0

  const targetConversations = targets.conversationsPerDay
  const targetMeetingsScheduled = targets.meetingsScheduledPerDay
  const targetMeetingsHeld = targets.meetingsHeldPerDay

  const conversationsNeeded = Math.max(0, targetConversations - conversations)
  const meetingsScheduledNeeded = Math.max(0, targetMeetingsScheduled - meetingsScheduled)
  const meetingsHeldNeeded = Math.max(0, targetMeetingsHeld - meetingsHeld)

  const isOnPace = conversationsNeeded === 0 && meetingsScheduledNeeded === 0 && meetingsHeldNeeded === 0

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Progress</h2>
        <div className="text-sm text-gray-600 mb-6">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-600">Conversations</div>
            <div className="text-3xl font-bold text-gray-900">{conversations}</div>
            <div className="text-sm text-gray-500">of {targetConversations}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Meetings Scheduled</div>
            <div className="text-3xl font-bold text-gray-900">{meetingsScheduled}</div>
            <div className="text-sm text-gray-500">of {targetMeetingsScheduled}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Meetings Held</div>
            <div className="text-3xl font-bold text-gray-900">{meetingsHeld}</div>
            <div className="text-sm text-gray-500">of {targetMeetingsHeld}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Listings Won</div>
            <div className="text-3xl font-bold text-gray-900">{listings}</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg ${isOnPace ? 'bg-green-50' : 'bg-amber-50'}`}>
          <h3 className={`font-semibold mb-2 ${isOnPace ? 'text-green-900' : 'text-amber-900'}`}>
            {isOnPace ? '🎉 You\'re on pace!' : '💪 Keep going!'}
          </h3>
          {!isOnPace && (
            <ul className="text-sm text-gray-700 space-y-1">
              {conversationsNeeded > 0 && (
                <li>• {conversationsNeeded} more conversation{conversationsNeeded !== 1 ? 's' : ''} to stay on track</li>
              )}
              {meetingsScheduledNeeded > 0 && (
                <li>• {meetingsScheduledNeeded} more meeting{meetingsScheduledNeeded !== 1 ? 's' : ''} to schedule</li>
              )}
              {meetingsHeldNeeded > 0 && (
                <li>• {meetingsHeldNeeded} more meeting{meetingsHeldNeeded !== 1 ? 's' : ''} to hold</li>
              )}
            </ul>
          )}
          {isOnPace && (
            <p className="text-sm text-green-800">You've hit all your targets for today. Great work!</p>
          )}
        </div>
      </div>
    </div>
  )
}
