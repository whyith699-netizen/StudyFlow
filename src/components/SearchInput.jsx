import { useState } from 'react'

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="relative flex items-center ml-auto">
      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 text-xs"></i>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`py-2 pl-8 pr-3 border rounded-lg text-sm bg-gray-100 dark:bg-surface-2 border-gray-200 dark:border-white/[0.08] text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder-white/40 transition-all focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-surface-3 focus:ring-2 focus:ring-primary/10 ${
          focused ? 'w-32' : 'w-24'
        }`}
      />
    </div>
  )
}
