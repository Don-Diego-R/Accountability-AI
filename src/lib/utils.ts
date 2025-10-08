import { KPIColor } from '@/types'

/**
 * Determines the color of a KPI based on percentage completion
 * @param actual - The actual value achieved
 * @param target - The target value
 * @returns 'green' if ≥100%, 'amber' if 60-99%, 'red' if <60%
 */
export function getKPIColor(actual: number, target: number): KPIColor {
  if (target === 0) return 'green'
  const percentage = (actual / target) * 100
  if (percentage >= 100) return 'green'
  if (percentage >= 60) return 'amber'
  return 'red'
}

/**
 * Safely parse an integer from a string or return 0
 */
export function safeParseInt(value: string | undefined | null): number {
  if (!value) return 0
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Safely parse a float from a string or return 0
 */
export function safeParseFloat(value: string | undefined | null): number {
  if (!value) return 0
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Calculate the number of days between two dates (inclusive)
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // inclusive
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Calculate percentage with safe division
 */
export function calculatePercentage(actual: number, target: number): number {
  if (target === 0) return 0
  return Math.round((actual / target) * 100)
}

/**
 * Get a friendly message for being on/off pace
 */
export function getPaceMessage(needed: number, metric: string): string {
  if (needed <= 0) return ''
  const plural = needed !== 1
  const metricPlural = metric + (plural ? 's' : '')
  return `${needed} more ${metricPlural} to stay on track`
}
