'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrendTabProps {
  startDate: string
  endDate: string
}

export default function TrendTab({ startDate, endDate }: TrendTabProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<'daily' | 'cumulative'>('daily')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/logs?startDate=${startDate}&endDate=${endDate}`)
        const data = await res.json()
        // Ensure data is always an array
        setLogs(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching logs:', error)
        setLogs([]) // Set empty array on error
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

  if (logs.length === 0) {
    return <div className="text-center py-12">No data available for this date range</div>
  }

  // Transform logs into chart data
  const dailyData = logs.map(log => ({
    date: log.date,
    Conversations: parseInt(log['Number of conversations (connects) today']) || 0,
    'Meetings Scheduled': parseInt(log['Number of sales meetings scheduled today']) || 0,
    'Meetings Held': parseInt(log['Number of sales meetings run today']) || 0,
    'Listings Won': parseInt(log['Number of listings today']) || 0,
  }))

  // Calculate cumulative data
  const cumulativeData = dailyData.reduce((acc, curr, index) => {
    if (index === 0) {
      acc.push({ ...curr })
    } else {
      const prev = acc[index - 1]
      acc.push({
        date: curr.date,
        Conversations: prev.Conversations + curr.Conversations,
        'Meetings Scheduled': prev['Meetings Scheduled'] + curr['Meetings Scheduled'],
        'Meetings Held': prev['Meetings Held'] + curr['Meetings Held'],
        'Listings Won': prev['Listings Won'] + curr['Listings Won'],
      })
    }
    return acc
  }, [] as any[])

  const chartData = viewType === 'daily' ? dailyData : cumulativeData

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {viewType === 'daily' ? 'Daily Trend' : 'Cumulative Trend'}
        </h2>
        <select
          value={viewType}
          onChange={(e) => setViewType(e.target.value as 'daily' | 'cumulative')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="daily">Daily Values</option>
          <option value="cumulative">Cumulative</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Conversations" stroke="#8b5cf6" strokeWidth={2} />
          <Line type="monotone" dataKey="Meetings Scheduled" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="Meetings Held" stroke="#10b981" strokeWidth={2} />
          <Line type="monotone" dataKey="Listings Won" stroke="#f59e0b" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
