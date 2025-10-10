// Type definitions for the application

export interface UserTargets {
  industry: string | null
  conversationsPerDay: number
  meetingsScheduledPerDay: number
  meetingsHeldPerDay: number
  listingsPerMonth: number
  appraisalsPerWeek: number
  listingPresentationsPerWeek: number
  offersPerDay: number
  groupPresentationsPerWeek: number
  monthlySalesGoal: number
  monthlyGCIGoal: number
}

export interface DailyLog {
  date: string
  'Number of in-person appraisals today'?: string
  'Number of listing presentations today'?: string
  'Number of listings today'?: string
  'Current GCI ($)'?: string
  'Number of conversations (connects) today'?: string
  'Number of sales meetings scheduled today'?: string
  'Number of sales meetings run today'?: string
  'Number of offers presented today'?: string
  'Number of group sales presentations today'?: string
  'Current sales today ($)'?: string
  [key: string]: string | undefined
}

export interface Task {
  id: number
  task: string
  completed: boolean
}

export interface ChartDataPoint {
  date: string
  Conversations: number
  'Meetings Scheduled': number
  'Meetings Held': number
  'Listings Won': number
}

export type KPIColor = 'green' | 'amber' | 'red'

export interface KPIMetric {
  title: string
  actual: number
  target: number
  color: KPIColor
}
