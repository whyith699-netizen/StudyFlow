import { useLang } from '../contexts/LanguageContext'

const DAY_KEYS = [
  { value: 'All', key: 'all' },
  { value: 'Mon', key: 'mon' },
  { value: 'Tue', key: 'tue' },
  { value: 'Wed', key: 'wed' },
  { value: 'Thu', key: 'thu' },
  { value: 'Fri', key: 'fri' },
  { value: 'Sat', key: 'sat' },
  { value: 'Sun', key: 'sun' },
]

export default function DayFilter({ activeDay, onDayChange }) {
  const { t } = useLang()

  return (
    <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
      {DAY_KEYS.map(({ value, key }) => (
        <button
          key={value}
          onClick={() => onDayChange(value)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex-1 min-w-0 text-center whitespace-nowrap cursor-pointer transition-all ${
            activeDay === value
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-100 dark:bg-surface-2 text-gray-700 dark:text-white/70 border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-surface-3'
          }`}
        >
          {t(key)}
        </button>
      ))}
    </div>
  )
}
