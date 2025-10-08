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

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/logs?startDate=${startDate}&endDate=${endDate}`)
        const data = await res.json()
        setLogs(data)
      } catch (error) {
        console.error('Error fetching logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (logs.length === 0) {
    return <div className="text-center py-12">No data available for this date range</div>
  }

  // Transform logs into chart data
  const chartData = logs.map(log => ({
    date: log.date,
    Conversations: parseInt(log['Number of conversations (connects) today']) || 0,
    'Meetings Scheduled': parseInt(log['Number of sales meetings scheduled today']) || 0,
    'Meetings Held': parseInt(log['Number of sales meetings run today']) || 0,
    'Listings Won': parseInt(log['Number of listings today']) || 0,
  }))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Trend</h2>
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
