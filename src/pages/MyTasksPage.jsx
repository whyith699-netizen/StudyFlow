import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useLang } from '../contexts/LanguageContext'
import Card from '../components/Card'
import { ConfirmDialog } from '../components/Modal'

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const map = {
    pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word',
    xls: 'fa-file-excel', xlsx: 'fa-file-excel',
    ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint',
    jpg: 'fa-file-image', jpeg: 'fa-file-image', png: 'fa-file-image', gif: 'fa-file-image',
    zip: 'fa-file-archive', rar: 'fa-file-archive',
    mp4: 'fa-file-video', mp3: 'fa-file-audio',
    js: 'fa-file-code', py: 'fa-file-code', html: 'fa-file-code',
    txt: 'fa-file-alt',
  }
  return map[ext] || 'fa-file'
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function MyTasksPage() {
  const navigate = useNavigate()
  const { classes, tasks, toggleTask, deleteTask } = useData()
  const { t } = useLang()
  const [filter, setFilter] = useState('pending')
  const [deleteId, setDeleteId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

  const filteredTasks = useMemo(() => {
    if (filter === 'pending') return tasks.filter(t => !t.completed)
    if (filter === 'completed') return tasks.filter(t => t.completed)
    return tasks
  }, [tasks, filter])

  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks])

  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || ''

  const priorityColors = {
    high: 'bg-red-400',
    medium: 'bg-amber-400',
    low: 'bg-emerald-400',
  }

  const priorityLabels = {
    high: t('high'),
    medium: t('medium'),
    low: t('low'),
  }

  const typeIcons = {
    individual: 'fa-user',
    group: 'fa-users',
    exam: 'fa-file-alt',
    other: 'fa-sticky-note',
  }

  const handleDeleteAllCompleted = () => {
    completedTasks.forEach(t => deleteTask(t.id))
    setShowDeleteAllConfirm(false)
  }

  const downloadFile = (file) => {
    const a = document.createElement('a')
    a.href = file.data
    a.download = file.name
    a.click()
  }

  return (
    <div className="flex flex-col gap-3 overflow-hidden h-full max-h-screen pb-2">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-surface-1 border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left text-primary"></i>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90">{t('myTasksTitle')}</h1>
        </div>
      </header>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-white/[0.06]">
          <i className="fas fa-tasks text-primary text-sm"></i>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 flex-1">All Tasks ({filteredTasks.length})</h3>
          <button onClick={() => navigate('/task/add')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors cursor-pointer">
            <i className="fas fa-plus text-[10px]"></i> {t('add')}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-3">
          {['pending', 'completed', 'all'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setExpandedId(null) }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize cursor-pointer transition-all ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-surface-3'
              }`}>
              {f === 'pending' ? t('pendingLabel') : f === 'completed' ? t('completedLabel') : t('allTasks')}
            </button>
          ))}

          {/* Delete All Completed */}
          {filter === 'completed' && completedTasks.length > 0 && (
            <button onClick={() => setShowDeleteAllConfirm(true)}
              className="ml-auto px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 border border-gray-200 dark:border-white/[0.08] hover:border-red-200 dark:hover:border-red-800/30">
              <i className="fas fa-trash-alt mr-1 text-[10px]"></i>{t('deleteTask')}
            </button>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto scrollbar-none space-y-2 min-h-0">
          {filteredTasks.length > 0 ? filteredTasks.map(task => {
            const isExpanded = expandedId === task.id
            const taskLinks = task.links || []
            const taskFiles = task.files || []
            const hasDetails = task.description || taskLinks.length > 0 || taskFiles.length > 0

            return (
              <div key={task.id}
                className={`rounded-lg transition-all border ${
                  isExpanded ? 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-1' :
                  'border-transparent hover:border-gray-200 dark:hover:border-white/[0.06]'
                } ${task.completed && !isExpanded ? 'bg-gray-50 dark:bg-surface-2/50 opacity-60' : 'bg-gray-50 dark:bg-surface-2'}`}>

                {/* Main row */}
                <div className="flex items-center gap-3 p-2.5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}>
                  {/* Checkbox */}
                  <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                      task.completed ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-white/20 hover:border-primary'
                    }`}>
                    {task.completed && <i className="fas fa-check text-[0.5rem]"></i>}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-4 rounded-full flex-shrink-0 ${priorityColors[task.priority] || 'bg-gray-300'}`}></div>
                      <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-400 dark:text-white/30' : 'text-gray-800 dark:text-white/85'}`}>
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 ml-3">
                      {getClassName(task.classId) && <span className="text-[0.65rem] text-gray-500 dark:text-white/40 truncate">{getClassName(task.classId)}</span>}
                      {task.dueDate && (
                        <span className="text-[0.65rem] text-gray-400 dark:text-white/30">
                          <i className="far fa-calendar-alt mr-0.5"></i>
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {hasDetails && (
                        <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[8px] text-gray-300 dark:text-white/20 ml-auto`}></i>
                      )}
                    </div>
                  </div>

                  {/* Edit */}
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/task/edit/${task.id}`) }}
                    className="text-gray-300 dark:text-white/20 hover:text-primary text-xs cursor-pointer transition-colors flex-shrink-0">
                    <i className="fas fa-pen"></i>
                  </button>

                  {/* Delete */}
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(task.id) }}
                    className="text-gray-300 dark:text-white/20 hover:text-red-500 text-xs cursor-pointer transition-colors flex-shrink-0">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 space-y-2.5 border-t border-gray-200 dark:border-white/[0.06] mx-2.5 mt-0">
                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-2 pt-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/20 text-primary text-[10px] font-medium capitalize">
                        <i className={`fas ${typeIcons[task.type] || typeIcons.other} text-[8px]`}></i>
                        {task.type || 'other'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 text-[10px] font-medium">
                        <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-300'}`}></div>
                        {priorityLabels[task.priority] || 'Normal'}
                      </span>
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 text-[10px] font-medium">
                          <i className="far fa-calendar-alt text-[8px]"></i>
                          {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {getClassName(task.classId) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 text-[10px] font-medium">
                          <i className="fas fa-chalkboard text-[8px]"></i>
                          {getClassName(task.classId)}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {task.description && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-white/30 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-xs text-gray-600 dark:text-white/60 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                      </div>
                    )}

                    {/* Links */}
                    {taskLinks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-white/30 uppercase tracking-wider mb-1">Links</p>
                        <div className="space-y-1">
                          {taskLinks.map((link, i) => {
                            let hostname = ''
                            try { hostname = new URL(link.url).hostname } catch { hostname = link.url }
                            return (
                              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-surface-2 text-xs text-gray-600 dark:text-white/60 hover:text-primary transition-colors no-underline border border-gray-200 dark:border-white/[0.04]">
                                <i className="fas fa-link text-[8px] text-primary/50"></i>
                                <span className="truncate">{hostname}</span>
                                <i className="fas fa-external-link-alt text-[7px] text-gray-300 dark:text-white/15 ml-auto"></i>
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Files */}
                    {taskFiles.length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium text-gray-400 dark:text-white/30 uppercase tracking-wider mb-1">Attachments</p>
                        <div className="space-y-1">
                          {taskFiles.map((file, i) => (
                            <div key={i} onClick={() => downloadFile(file)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-surface-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-surface-3 transition-colors border border-gray-200 dark:border-white/[0.04]">
                              <i className={`fas ${getFileIcon(file.name)} text-sm text-primary/60`}></i>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600 dark:text-white/60 truncate">{file.name}</p>
                                <p className="text-[9px] text-gray-400 dark:text-white/25">{formatFileSize(file.size)}</p>
                              </div>
                              <i className="fas fa-download text-[10px] text-gray-300 dark:text-white/20"></i>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No extra details */}
                    {!task.description && taskLinks.length === 0 && taskFiles.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-white/30 italic">No additional details</p>
                    )}
                  </div>
                )}
              </div>
            )
          }) : (
            <p className="text-center text-sm text-gray-400 dark:text-white/40 py-8">
              {filter === 'pending' ? <><i className="fas fa-check-circle text-primary mr-1"></i>{t('noTasks')}</> : filter === 'completed' ? t('noTasksFound') : t('noTasks')}
            </p>
          )}
        </div>
      </Card>

      {/* Delete single task */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteTask(deleteId); setDeleteId(null) }}
        title={t('deleteTask')}
        message={t('confirmDelete')}
      />

      {/* Delete all completed */}
      <ConfirmDialog
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllCompleted}
        title={t('deleteTask')}
        message={t('confirmDelete')}
      />
    </div>
  )
}
