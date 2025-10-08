'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import HomeTab from './HomeTab'
import TrendTab from './TrendTab'
import TodayTab from './TodayTab'
import TasksTab from './TasksTab'
import { ArrowLeft } from 'lucide-react'

type Tab = 'Home' | 'Trend' | 'Today' | 'Tasks'

export default function Dashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('Home')
  const [dateFilter, setDateFilter] = useState('This Month')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  useEffect(() => {
    if (dateFilter === 'This Month') {
      setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    }
  }, [dateFilter])

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
        </div>

        {/* Tab Content */}
        <div className="mt-6 pb-12">
          {activeTab === 'Home' && <HomeTab startDate={startDate} endDate={endDate} />}
          {activeTab === 'Trend' && <TrendTab startDate={startDate} endDate={endDate} />}
          {activeTab === 'Today' && <TodayTab />}
          {activeTab === 'Tasks' && <TasksTab />}
        </div>
      </div>
    </div>
  )
}
