import { useState, useRef, useEffect } from 'react'

/**
 * Premium custom dropdown select — replaces native <select>.
 *
 * Props:
 *  - value        current value
 *  - onChange(v)   called when user picks an option
 *  - options       [{ value, label, icon?, color? }]
 *  - placeholder   text when nothing is selected
 *  - searchable    show a search input (default false)
 *  - icon          left icon class for the trigger (e.g. "fas fa-book")
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = '—',
  searchable = false,
  icon,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = options.find(o => o.value === value)
  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all
          ${open
            ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-surface-2'
            : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 hover:border-gray-300 dark:hover:border-white/[0.14]'
          } shadow-sm`}
      >
        {/* Left icon */}
        {(selected?.icon || icon) && (
          <i className={`${selected?.icon || icon} text-xs text-primary/70 flex-shrink-0`}></i>
        )}

        {/* Label */}
        <span className={`flex-1 text-left truncate ${selected ? 'text-gray-800 dark:text-white/90' : 'text-gray-400 dark:text-white/40'}`}>
          {selected ? selected.label : placeholder}
        </span>

        {/* Chevron */}
        <i className={`fas fa-chevron-down text-[10px] text-gray-400 dark:text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 py-1
          bg-white dark:bg-surface-1 border border-gray-200 dark:border-white/[0.1]
          rounded-xl shadow-lg shadow-black/8 dark:shadow-black/30
          animate-in fade-in slide-in-from-top-1 duration-150
          max-h-52 flex flex-col overflow-hidden"
        >
          {/* Search */}
          {searchable && (
            <div className="px-2 pb-1.5 pt-1">
              <div className="relative">
                <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-white/30"></i>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                  placeholder="Search..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-surface-2 text-gray-800 dark:text-white/90 text-xs placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="overflow-y-auto scrollbar-none flex-1">
            {/* Empty / placeholder option */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors
                ${!value
                  ? 'bg-primary/5 dark:bg-primary/10 text-primary font-medium'
                  : 'text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-surface-2'
                }`}
            >
              <span className="w-4 text-center flex-shrink-0">—</span>
              <span>{placeholder}</span>
              {!value && <i className="fas fa-check text-[8px] text-primary ml-auto"></i>}
            </button>

            {filtered.length > 0 ? filtered.map(opt => {
              const isActive = opt.value === value
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors
                    ${isActive
                      ? 'bg-primary/5 dark:bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-surface-2'
                    }`}
                >
                  {/* Option icon */}
                  {opt.icon && (
                    <i className={`${opt.icon} w-4 text-center flex-shrink-0 text-[11px] ${isActive ? 'text-primary' : 'text-gray-400 dark:text-white/40'}`}></i>
                  )}
                  {/* Color dot */}
                  {opt.color && (
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.color}`}></span>
                  )}

                  <span className="truncate">{opt.label}</span>

                  {isActive && <i className="fas fa-check text-[8px] text-primary ml-auto flex-shrink-0"></i>}
                </button>
              )
            }) : (
              <p className="text-center text-[11px] text-gray-400 dark:text-white/30 py-4">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
