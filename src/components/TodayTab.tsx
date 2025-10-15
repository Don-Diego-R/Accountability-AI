'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { utcOffsetToIANA } from '@/lib/timezone'
import { Edit2, Save, X } from 'lucide-react'

export default function TodayTab() {
  const [targets, setTargets] = useState<any>(null)
  const [todayLog, setTodayLog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // First fetch targets to get timezone
        const targetsRes = await fetch('/api/targets')
        const targetsData = await targetsRes.json()
        setTargets(targetsData)

        // Parse timezone offset (e.g., "UTC+12" -> 12)
        const timezone = targetsData.timezone || 'UTC+0'
        
        // Convert UTC offset to IANA timezone
        const ianaTimezone = utcOffsetToIANA(timezone)
        const now = new Date()
        const userTime = toZonedTime(now, ianaTimezone)
        const today = format(userTime, 'yyyy-MM-dd')

        console.log('🌍 TodayTab Timezone Debug:', {
          timezoneFromSheet: timezone,
          ianaTimezone,
          serverNow: now.toISOString(),
          userTime: userTime.toISOString(),
          todayFormatted: today
        })

        // Fetch logs for today in user's timezone
        const logsUrl = `/api/logs?startDate=${today}&endDate=${today}`
        console.log('📡 Fetching logs from:', logsUrl)
        
        const logsRes = await fetch(logsUrl)
        const logsData = await logsRes.json()
        
        console.log('📊 Logs response:', logsData)

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

  // Helper to check if user has a target for this metric (from Users Table)
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

  const conversations = todayLog ? parseInt(todayLog['Number of conversations (connects) today']) || 0 : 0
  const meetingsScheduled = todayLog ? parseInt(todayLog['Number of sales meetings scheduled today']) || 0 : 0
  const meetingsHeld = todayLog ? parseInt(todayLog['Number of sales meetings run today']) || 0 : 0
  const listings = todayLog ? parseInt(todayLog['Number of listings today']) || 0 : 0
  const appraisals = todayLog ? parseInt(todayLog['Number of in-person appraisals today']) || 0 : 0
  const listingPresentations = todayLog ? parseInt(todayLog['Number of listing presentations today']) || 0 : 0
  const offers = todayLog ? parseInt(todayLog['Number of offers presented today']) || 0 : 0
  const groupPresentations = todayLog ? parseInt(todayLog['Number of group sales presentations today']) || 0 : 0
  const currentSales = todayLog ? parseFloat(todayLog['Current sales today ($)']) || 0 : 0
  const currentGCI = todayLog ? parseFloat(todayLog['Current GCI ($)']) || 0 : 0

  // Convert all targets to daily equivalents (ceiling of weekly/monthly conversions)
  const targetConversations = targets.conversationsPerDay
  const targetMeetingsScheduled = targets.meetingsScheduledPerDay
  const targetMeetingsHeld = targets.meetingsHeldPerDay
  const targetListings = Math.ceil(targets.listingsPerMonth / 30) // Monthly → Daily
  const targetAppraisals = Math.ceil(targets.appraisalsPerWeek / 7) // Weekly → Daily
  const targetListingPresentations = Math.ceil(targets.listingPresentationsPerWeek / 7) // Weekly → Daily
  const targetOffers = targets.offersPerDay
  const targetGroupPresentations = Math.ceil(targets.groupPresentationsPerWeek / 7) // Weekly → Daily

  const conversationsNeeded = Math.max(0, targetConversations - conversations)
  const meetingsScheduledNeeded = Math.max(0, targetMeetingsScheduled - meetingsScheduled)
  const meetingsHeldNeeded = Math.max(0, targetMeetingsHeld - meetingsHeld)

  const isOnPace = conversationsNeeded === 0 && meetingsScheduledNeeded === 0 && meetingsHeldNeeded === 0

  // Build list of metrics to display based on user's targets
  const metrics: Array<{ label: string; value: number; target: number | null; field: string }> = []
  if (shouldShowMetric('conversations')) {
    metrics.push({ 
      label: 'Conversations', 
      value: conversations, 
      target: targetConversations,
      field: 'Number of conversations (connects) today'
    })
  }
  if (shouldShowMetric('meetingsScheduled')) {
    metrics.push({ 
      label: 'Meetings Scheduled', 
      value: meetingsScheduled, 
      target: targetMeetingsScheduled,
      field: 'Number of sales meetings scheduled today'
    })
  }
  if (shouldShowMetric('meetingsHeld')) {
    metrics.push({ 
      label: 'Meetings Held', 
      value: meetingsHeld, 
      target: targetMeetingsHeld,
      field: 'Number of sales meetings run today'
    })
  }
  if (shouldShowMetric('listings')) {
    metrics.push({ 
      label: 'Listings Won', 
      value: listings, 
      target: targetListings,
      field: 'Number of listings today'
    })
  }
  if (shouldShowMetric('appraisals')) {
    metrics.push({ 
      label: 'Appraisals', 
      value: appraisals, 
      target: targetAppraisals,
      field: 'Number of in-person appraisals today'
    })
  }
  if (shouldShowMetric('listingPresentations')) {
    metrics.push({ 
      label: 'Listing Presentations', 
      value: listingPresentations, 
      target: targetListingPresentations,
      field: 'Number of listing presentations today'
    })
  }
  if (shouldShowMetric('offers')) {
    metrics.push({ 
      label: 'Offers Presented', 
      value: offers, 
      target: targetOffers,
      field: 'Number of offers presented today'
    })
  }
  if (shouldShowMetric('groupPresentations')) {
    metrics.push({ 
      label: 'Group Presentations', 
      value: groupPresentations, 
      target: targetGroupPresentations,
      field: 'Number of group sales presentations today'
    })
  }

  // Always show sales and GCI fields if user is in real estate
  if (targets.industry === 'Real Estate') {
    metrics.push({
      label: 'Current Sales ($)',
      value: currentSales,
      target: null,
      field: 'Current sales today ($)'
    })
    metrics.push({
      label: 'Current GCI ($)',
      value: currentGCI,
      target: null,
      field: 'Current GCI ($)'
    })
  }

  function startEditMode() {
    // Initialize edited values with current values
    const initial: Record<string, string> = {}
    metrics.forEach(metric => {
      initial[metric.field] = String(metric.value)
    })
    setEditedValues(initial)
    setIsEditMode(true)
  }

  function cancelEditMode() {
    setIsEditMode(false)
    setEditedValues({})
  }

  async function saveLog() {
    try {
      console.log('🔄 Saving log:', editedValues)
      
      const res = await fetch('/api/logs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logData: editedValues }),
      })

      if (!res.ok) {
        console.error('❌ Failed to save log:', await res.text())
        alert('Failed to save log. Please try again.')
        return
      }

      console.log('✅ Log saved successfully')
      
      // Update local state with new values
      const updatedLog = { ...todayLog, ...editedValues }
      setTodayLog(updatedLog)
      setIsEditMode(false)
      setEditedValues({})
      
      alert('Log saved successfully!')
    } catch (error) {
      console.error('❌ Error saving log:', error)
      alert('Failed to save log. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Today&apos;s Progress</h2>
          {!isEditMode ? (
            <button
              onClick={startEditMode}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Log today&apos;s performance manually
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={saveLog}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEditMode}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-6">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>

        <div className={`grid grid-cols-2 md:grid-cols-${Math.min(metrics.length, 4)} gap-6 mb-6`}>
          {metrics.map((metric, idx) => (
            <div key={idx}>
              <div className="text-sm text-gray-600">{metric.label}</div>
              {isEditMode ? (
                <input
                  type="number"
                  value={editedValues[metric.field] || ''}
                  onChange={(e) => setEditedValues({ ...editedValues, [metric.field]: e.target.value })}
                  className="w-full text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none focus:border-blue-700 bg-blue-50 px-2 py-1"
                  step={metric.label.includes('$') ? '0.01' : '1'}
                />
              ) : (
                <div className="text-3xl font-bold text-gray-900">
                  {metric.label.includes('$') ? `$${metric.value.toLocaleString()}` : metric.value}
                </div>
              )}
              {metric.target !== null && (
                <div className="text-sm text-gray-500">of {metric.target}</div>
              )}
            </div>
          ))}
        </div>

        {!isEditMode && (
          <div className={`p-4 rounded-lg ${isOnPace ? 'bg-green-50' : 'bg-amber-50'}`}>
            <h3 className={`font-semibold mb-2 ${isOnPace ? 'text-green-900' : 'text-amber-900'}`}>
              {isOnPace ? '🎉 You&apos;re on pace!' : '💪 Keep going!'}
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
              <p className="text-sm text-green-800">You&apos;ve hit all your targets for today. Great work!</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
