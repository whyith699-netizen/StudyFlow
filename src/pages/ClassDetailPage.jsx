import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useLang } from '../contexts/LanguageContext'
import Card from '../components/Card'
import Button from '../components/Button'
import { ConfirmDialog } from '../components/Modal'
import { useState, useMemo } from 'react'

function getFaviconUrl(url) {
  try {
    const hostname = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return null
  }
}

function getDaysUntilDue(dueDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

export default function ClassDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { classes, tasks, deleteClass } = useData()
  const { t } = useLang()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const cls = useMemo(() => classes.find(c => c.id === id), [classes, id])

  const classTasks = useMemo(() => {
    const filtered = tasks.filter(t => t.classId === id)
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate)
      return 0
    })
    return filtered
  }, [tasks, id])

  const pendingCount = classTasks.filter(t => !t.completed).length

  if (!cls) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-white/40">
        <i className="fas fa-exclamation-circle text-3xl mb-3 text-gray-300 dark:text-white/20"></i>
        <p className="text-sm font-medium">{t('classNotFound')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-xs text-primary hover:text-primary-dark cursor-pointer transition-colors">{t('goBack')}</button>
      </div>
    )
  }

  const links = Array.isArray(cls.links) ? cls.links : []
  const typeIcons = { exam: 'fa-file-alt', individual: 'fa-user', group: 'fa-users', other: 'fa-sticky-note' }

  return (
    <div className="flex flex-col gap-3 overflow-auto h-full max-h-[600px] pb-4 bg-[#f8f9fa] dark:bg-black scrollbar-none">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left text-primary"></i>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('classDetails')}</h1>
        </div>
      </header>

      {/* Class Info */}
      <Card>
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{cls.name}</h2>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => navigate(`/class/edit/${id}`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer" title={t('editClass')}>
              <i className="fas fa-edit text-sm"></i>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors cursor-pointer" title={t('deleteClass')}>
              <i className="fas fa-trash text-sm"></i>
            </button>
          </div>
        </div>
        {/* Day tags */}
        {cls.days && cls.days.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {cls.days.map(day => (
              <span key={day} className="px-2.5 py-1 bg-primary text-white rounded-md text-xs font-medium capitalize">
                {day}
              </span>
            ))}
          </div>
        )}
        
        {/* Missing Info: Teacher and Description */}
        {cls.teacher && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3"><i className="fas fa-user mr-2 text-gray-400"></i>{cls.teacher}</p>
        )}
        {cls.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5"><i className="fas fa-align-left mr-2 text-gray-400"></i>{cls.description}</p>
        )}

        {cls.room && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5"><i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>{cls.room}</p>
        )}
        
        {/* Schedules Array */}
        {cls.schedules && cls.schedules.length > 0 ? (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {cls.schedules.map((s, i) => (
              <div key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <i className="far fa-clock mr-2 text-gray-400"></i>
                <span className="capitalize font-medium text-gray-800 dark:text-gray-200 min-w-[50px]">{s.day}</span>
                <span className="ml-1 opacity-80">{s.time}</span>
              </div>
            ))}
          </div>
        ) : cls.time && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5"><i className="far fa-clock mr-2 text-gray-400"></i>{cls.time}</p>
        )}
      </Card>

      {/* Links Section */}
      <Card>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-[#1a1a1a] text-blue-600 dark:text-blue-400">
            <i className="fas fa-link text-sm"></i>
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1">{t('classLinks')}</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{links.length}</span>
        </div>
        <div className="flex flex-col gap-2">
          {links.length > 0 ? links.map((link, i) => {
            let hostname = ''
            try { hostname = new URL(link.url).hostname } catch { hostname = link.url }
            const faviconSrc = getFaviconUrl(link.url)

            return (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white dark:bg-[#111] rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-[#1a1a1a] no-underline border border-gray-100 dark:border-gray-800">
                {faviconSrc ? (
                  <img src={faviconSrc} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100 dark:border-gray-800"
                    onError={e => { e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <i className="fas fa-globe text-xs"></i>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{link.title || hostname}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">{hostname}</div>
                </div>
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 flex-shrink-0">
                  <i className="fas fa-external-link-alt text-[10px]"></i>
                </div>
              </a>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-[#111]">
               <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-2 text-gray-400">
                 <i className="fas fa-link"></i>
               </div>
               <p className="text-sm text-gray-500 font-medium">{t('noLinks', 'No links added')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Tasks Section */}
      <Card>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 dark:bg-primary/20 text-primary">
            <i className="fas fa-tasks text-sm"></i>
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1">{t('classTasks')}</h3>
           <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{pendingCount} Pending</span>
        </div>
        <div className="flex flex-col gap-2">
          {classTasks.length > 0 ? classTasks.map(task => {
            const taskType = task.type || 'other'
            const daysUntil = task.dueDate && !task.completed ? getDaysUntilDue(task.dueDate) : null
            const dueClass = daysUntil !== null ? (daysUntil <= 1 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : daysUntil <= 3 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20') : ''
            const dueText = daysUntil !== null ? (daysUntil < 0 ? t('overdue') : daysUntil === 0 ? t('dueToday') : daysUntil === 1 ? t('dueTomorrow') : t('dueInDays', { n: daysUntil })) : ''

            return (
              <div key={task.id} onClick={() => navigate(`/task/edit/${task.id}`)}
                className="flex items-center gap-3 p-3 bg-white dark:bg-[#111] rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer border border-gray-100 dark:border-gray-800">
                {/* Type icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${task.completed ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-primary/10 dark:bg-primary/20 text-primary'}`}>
                  <i className={`fas ${typeIcons[taskType] || typeIcons.other}`}></i>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-gray-400 dark:text-gray-600 mt-0.5' : 'text-gray-800 dark:text-gray-100'}`}>
                    {task.title || 'Untitled Task'}
                  </div>
                  <div className="text-[11px] text-gray-500 capitalize mt-0.5">{taskType}</div>
                </div>
                {/* Due badge */}
                {dueText && !task.completed && (
                  <span className={`text-[10px] font-medium px-2 py-1 rounded border border-transparent ${dueClass}`}>{dueText}</span>
                )}
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-[#111]">
               <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-2 text-gray-400">
                 <i className="fas fa-check-double"></i>
               </div>
               <p className="text-sm text-gray-500 font-medium">{t('noTasksForClass')}</p>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { deleteClass(id); navigate('/') }}
        title={t('deleteClass')}
        message={`${t('confirmDelete').replace('this', `"${cls.name}"`)}`}
      />
    </div>
  )
}
