const variants = {
  primary: 'bg-primary hover:bg-primary-dark text-white border-primary',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
  outline: 'bg-transparent hover:bg-gray-100 dark:hover:bg-surface-2 text-gray-700 dark:text-white/70 border-gray-300 dark:border-white/[0.08]',
  ghost: 'bg-gray-100 dark:bg-surface-2 hover:bg-gray-200 dark:hover:bg-surface-3 text-gray-700 dark:text-white/70 border-transparent',
  icon: 'bg-gray-100 dark:bg-surface-2 hover:bg-gray-200 dark:hover:bg-surface-3 text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/[0.08] !p-0 w-8 h-8',
}

export default function Button({ children, variant = 'ghost', className = '', onClick, disabled, title, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.ghost} ${className}`}
    >
      {children}
    </button>
  )
}
