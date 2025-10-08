/**
 * Converts UTC offset string (e.g., "UTC+12") to IANA timezone name
 * This allows the app to work with Google Sheets data that uses UTC offset format
 */
export function utcOffsetToIANA(utcOffset: string): string {
  const offsetMap: { [key: string]: string } = {
    'UTC+13': 'Pacific/Tongatapu',
    'UTC+12': 'Pacific/Auckland',
    'UTC+11': 'Pacific/Noumea',
    'UTC+10': 'Australia/Sydney',
    'UTC+9': 'Asia/Tokyo',
    'UTC+8': 'Asia/Singapore',
    'UTC+7': 'Asia/Bangkok',
    'UTC+6': 'Asia/Dhaka',
    'UTC+5': 'Asia/Karachi',
    'UTC+4': 'Asia/Dubai',
    'UTC+3': 'Europe/Moscow',
    'UTC+2': 'Europe/Athens',
    'UTC+1': 'Europe/Paris',
    'UTC+0': 'UTC',
    'UTC-4': 'America/Caracas',
    'UTC-5': 'America/New_York',
    'UTC-6': 'America/Chicago',
    'UTC-7': 'America/Denver',
    'UTC-8': 'America/Los_Angeles',
    'UTC-9': 'America/Anchorage',
    'UTC-10': 'Pacific/Honolulu',
  }

  return offsetMap[utcOffset] || 'UTC'
}
