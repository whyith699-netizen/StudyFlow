export default function Card({ children, className = '', ...props }) {
  return (
    <section {...props} className={`bg-white dark:bg-[#0a0a0a] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden relative flex-shrink-0 flex flex-col ${className}`}>
      {children}
    </section>
  )
}

export function CardHeader({ icon, iconColor = 'text-primary', title, children }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800 overflow-visible relative">
      {icon && <i className={`fas ${icon} text-lg ${iconColor}`}></i>}
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight flex-1">{title}</h3>
      {children}
    </div>
  )
}
