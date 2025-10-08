'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { utcOffsetToIANA } from '@/lib/timezone'
import HomeTab from './HomeTab'
import TrendTab from './TrendTab'
import TodayTab from './TodayTab'
import TasksTab from './TasksTab'
import { ArrowLeft, RefreshCw } from 'lucide-react'

type Tab = 'Home' | 'Trend' | 'Today' | 'Tasks'

export default function Dashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('Home')
  const [dateFilter, setDateFilter] = useState('This Month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [userTimezone, setUserTimezone] = useState<string>('UTC+0')

  useEffect(() => {
    // Fetch user timezone on mount and initialize dates
    async function fetchTimezone() {
      try {
        const res = await fetch('/api/targets')
        const data = await res.json()
        if (data.timezone) {
          setUserTimezone(data.timezone)
        }
      } catch (error) {
        console.error('Error fetching timezone:', error)
      }
    }
    fetchTimezone()
  }, [])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getUserDate = () => {
    // Convert UTC offset (e.g., "UTC+12") to IANA timezone (e.g., "Pacific/Auckland")
    const ianaTimezone = utcOffsetToIANA(userTimezone)
    const now = new Date()
    const userTime = toZonedTime(now, ianaTimezone)
    
    console.log('🌍 Dashboard Timezone Debug:', {
      userTimezoneFromSheet: userTimezone,
      ianaTimezone,
      serverNow: now.toISOString(),
      userTime: userTime.toISOString(),
      userTimeFormatted: format(userTime, 'yyyy-MM-dd HH:mm:ss')
    })
    
    return userTime
  }

  useEffect(() => {
    // Only update dates if we have a timezone
    if (!userTimezone || userTimezone === 'UTC+0') return

    const today = getUserDate()
    if (dateFilter === 'Today') {
      const start = format(startOfDay(today), 'yyyy-MM-dd')
      const end = format(endOfDay(today), 'yyyy-MM-dd')
      console.log('📅 Setting Today filter:', { start, end })
      setStartDate(start)
      setEndDate(end)
    } else if (dateFilter === 'This Week') {
      const start = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const end = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      console.log('📅 Setting This Week filter:', { start, end })
      setStartDate(start)
      setEndDate(end)
    } else if (dateFilter === 'This Month') {
      const start = format(startOfMonth(today), 'yyyy-MM-dd')
      const end = format(endOfMonth(today), 'yyyy-MM-dd')
      console.log('📅 Setting This Month filter:', { start, end })
      setStartDate(start)
      setEndDate(end)
    }
    // Note: Custom filter allows manual date selection, so we don't override it
  }, [dateFilter, userTimezone])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Accountability Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['Home', 'Trend', 'Today', 'Tasks'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Date Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Custom</option>
          </select>

          {dateFilter === 'Custom' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <button
            onClick={handleRefresh}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6 pb-12">
          {activeTab === 'Home' && <HomeTab key={`home-${refreshKey}`} startDate={startDate} endDate={endDate} />}
          {activeTab === 'Trend' && <TrendTab key={`trend-${refreshKey}`} startDate={startDate} endDate={endDate} />}
          {activeTab === 'Today' && <TodayTab key={`today-${refreshKey}`} />}
          {activeTab === 'Tasks' && <TasksTab key={`tasks-${refreshKey}`} />}
        </div>
      </div>
    </div>
  )
}
