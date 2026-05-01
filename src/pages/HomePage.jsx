import { useState, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useLang } from '../contexts/LanguageContext'
import { buildFaviconUrl } from '../config/studyTools'
import Card from '../components/Card'
import SearchInput from '../components/SearchInput'
import DayFilter from '../components/DayFilter'

// Resolve class icon - handles both 'fa-book' and 'book' formats
const getClassIcon = (cls) => {
  const icon = cls.icon
  if (!icon) return 'fa-graduation-cap'
  if (icon.startsWith('fa-')) return icon
  return `fa-${icon}`
}

function openExternalUrl(url) {
  if (!url) return
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

function resolveToolName(tool, t) {
  return tool.name || (tool.nameKey ? t(tool.nameKey) : '')
}

function ToolLogo({ tool }) {
  const [imageFailed, setImageFailed] = useState(false)
  const logoUrl = imageFailed ? '' : (tool.logoUrl || buildFaviconUrl(tool.launchUrl))

  return (
    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center border border-blue-500/30 shadow-sm overflow-hidden flex-shrink-0">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="w-6 h-6 object-contain" onError={() => setImageFailed(true)} />
      ) : (
        <i className={`fas ${tool.icon || 'fa-globe'} text-sm`} />
      )}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { classes, tasks, studyTools, reorderClasses } = useData()
  const { t } = useLang()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDay, setActiveDay] = useState('All')
  const [classPage, setClassPage] = useState(0)
  const [activeTab, setActiveTab] = useState('classes')
  const [toolSearchQuery, setToolSearchQuery] = useState('')
  const importRef = useRef(null)
  const classesPerPage = 18

  // Filter classes by search AND day
  const filteredClasses = useMemo(() => {
    let filtered = classes
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(c => c.name?.toLowerCase().includes(q))
    }
    if (activeDay !== 'All') {
      const dayMap = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
      const fullDay = dayMap[activeDay]
      filtered = filtered.filter(c => c.days?.includes(fullDay))
    }
    return filtered
  }, [classes, searchQuery, activeDay])

  // Paginate classes
  const paginatedClasses = useMemo(() => {
    const start = classPage * classesPerPage
    return filteredClasses.slice(start, start + classesPerPage)
  }, [filteredClasses, classPage])

  const totalClassPages = Math.ceil(filteredClasses.length / classesPerPage)

  // Count task stats
  const taskStats = useMemo(() => {
    const pending = tasks.filter(t => !t.completed)
    return {
      total: pending.length,
      exam: pending.filter(t => t.type === 'exam').length,
      individual: pending.filter(t => t.type === 'individual').length,
      group: pending.filter(t => t.type === 'group').length,
    }
  }, [tasks])

  const customStudyToolCount = useMemo(
    () => studyTools.filter((tool) => !tool.isDefault).length,
    [studyTools]
  )

  // Filter study tools by search
  const filteredTools = useMemo(() => {
    const query = toolSearchQuery.trim().toLowerCase()
    if (!query) return studyTools
    return studyTools.filter((tool) => {
      const name = resolveToolName(tool, t).toLowerCase()
      return name.includes(query) || (tool.launchUrl || '').toLowerCase().includes(query)
    })
  }, [toolSearchQuery, studyTools, t])

  // ========== DRAG TO REORDER ==========
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const isDragEnabled = !searchQuery && activeDay === 'All' && totalClassPages <= 1

  const handleDragStart = useCallback((e, idx) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    // Transparent drag image for cleaner look
    const ghost = e.currentTarget.cloneNode(true)
    ghost.style.opacity = '0.6'
    ghost.style.position = 'absolute'
    ghost.style.top = '-1000px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 30, 30)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }, [])

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIdx(idx)
  }, [])

  const handleDrop = useCallback((e, dropIdx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null)
      setOverIdx(null)
      return
    }
    const newClasses = [...classes]
    const [moved] = newClasses.splice(dragIdx, 1)
    newClasses.splice(dropIdx, 0, moved)
    reorderClasses(newClasses)
    setDragIdx(null)
    setOverIdx(null)
  }, [dragIdx, classes, reorderClasses])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setOverIdx(null)
  }, [])




  // Export data
  const handleExport = () => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['myClasses', 'tasks', 'studyTools'], (result) => {
        const data = JSON.stringify(result, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'studyflow-backup.json'
        a.click()
        URL.revokeObjectURL(url)
      })
    }
  }

  // Import data
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set(data, () => window.location.reload())
        }
      } catch (err) {
        alert(t('invalidJson'))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-3 overflow-hidden h-full max-h-screen pb-0.5">
      {/* ============ COMBINED CLASSES + TOOLS CARD ============ */}
      <Card className="flex-1 min-h-0 flex flex-col">
        {/* Header: Segmented Tabs + Action Buttons */}
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-200 dark:border-white/[0.06]">
          {/* Segmented Tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-surface-2 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-white dark:bg-surface shadow-sm text-gray-900 dark:text-white font-semibold'
                  : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
              }`}
            >
              {t('myClasses')}
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-white dark:bg-surface shadow-sm text-gray-900 dark:text-white font-semibold'
                  : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
              }`}
            >
              {t('toolsTitle')}
            </button>
          </div>

          {/* Search (scoped per tab) */}
          {activeTab === 'classes' ? (
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder={t('search')} />
          ) : (
            <SearchInput value={toolSearchQuery} onChange={setToolSearchQuery} placeholder={t('search')} />
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {activeTab === 'classes' ? (
              <>
                <button onClick={handleExport} title={t('exportData')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-surface-3 transition-colors cursor-pointer">
                  <i className="fas fa-download text-xs"></i>
                </button>
                <button onClick={() => importRef.current?.click()} title={t('importData')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-surface-3 transition-colors cursor-pointer">
                  <i className="fas fa-upload text-xs"></i>
                </button>
                <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                <button onClick={() => navigate('/class/add')} title={t('addClass')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer">
                  <i className="fas fa-plus text-xs"></i>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/tools')} title={t('toolsTitle')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-surface-3 transition-colors cursor-pointer">
                  <i className="fas fa-arrow-up-right-from-square text-xs"></i>
                </button>
                <button onClick={() => navigate('/tools')} title={t('toolsAddCustom')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer">
                  <i className="fas fa-plus text-xs"></i>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'classes' ? (
          <>
            {/* Day Filter */}
            <DayFilter activeDay={activeDay} onDayChange={setActiveDay} />

            {/* Class Grid */}
            {paginatedClasses.length > 0 ? (
              <div className="grid grid-cols-6 gap-2 flex-1 overflow-y-auto scrollbar-none content-start">
                {paginatedClasses.map((cls, idx) => (
                  <div
                    key={cls.id}
                    draggable={isDragEnabled}
                    onDragStart={isDragEnabled ? (e) => handleDragStart(e, idx) : undefined}
                    onDragOver={isDragEnabled ? (e) => handleDragOver(e, idx) : undefined}
                    onDrop={isDragEnabled ? (e) => handleDrop(e, idx) : undefined}
                    onDragEnd={isDragEnabled ? handleDragEnd : undefined}
                    className={`flex flex-col items-center text-center py-2 px-1 cursor-pointer group rounded-xl transition-all
                      ${dragIdx === idx ? 'opacity-30 scale-95' : ''}
                      ${overIdx === idx && dragIdx !== idx ? 'ring-2 ring-primary/40 bg-primary/5 dark:bg-primary/10 scale-105' : ''}
                    `}
                    onClick={() => navigate(`/class/${cls.id}`)}
                  >
                    <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-surface-2 text-gray-600 dark:text-white/60 text-lg transition-all group-hover:bg-primary group-hover:text-white group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:shadow-primary/15">
                      <i className={`fas ${getClassIcon(cls)}`}></i>
                    </div>
                    <span className="text-[0.68rem] font-medium text-gray-700 dark:text-white/70 mt-2 truncate w-full px-0.5 leading-tight">
                      {cls.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 dark:text-white/40 py-6">
                {searchQuery || activeDay !== 'All' ? t('noClassesFound') : t('noClassesYet')}
              </p>
            )}

            {/* Pagination */}
            {totalClassPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-200 dark:border-white/[0.06]">
                <button onClick={() => setClassPage(p => Math.max(0, p - 1))} disabled={classPage === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] disabled:opacity-30 cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-surface-3">
                  <i className="fas fa-chevron-left text-[0.6rem]"></i>
                </button>
                <span className="text-xs text-gray-500 dark:text-white/50 min-w-[40px] text-center">{classPage + 1} / {totalClassPages}</span>
                <button onClick={() => setClassPage(p => Math.min(totalClassPages - 1, p + 1))} disabled={classPage >= totalClassPages - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] disabled:opacity-30 cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-surface-3">
                  <i className="fas fa-chevron-right text-[0.6rem]"></i>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Tool count info bar */}
            <div className="flex items-center gap-2 mb-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20">
                {studyTools.length}
              </span>
              <span className="text-gray-500 dark:text-white/40">
                {t('toolsCustomCount', { n: customStudyToolCount })}
              </span>
            </div>

            {/* Tools Grid */}
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 flex-1 overflow-y-auto scrollbar-none content-start">
                {filteredTools.map((tool) => {
                  const toolName = resolveToolName(tool, t)
                  return (
                    <div
                      key={tool.id}
                      onClick={() => openExternalUrl(tool.launchUrl)}
                      className="flex flex-col items-center text-center py-2 px-1 cursor-pointer group rounded-xl transition-all"
                    >
                      <ToolLogo tool={tool} />
                      <span className="text-[0.68rem] font-medium text-gray-700 dark:text-white/70 mt-2 truncate w-full px-0.5 leading-tight">
                        {toolName}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 dark:text-white/40 py-6">
                {toolSearchQuery ? t('noClassesFound') : t('toolsEmptyState')}
              </p>
            )}

            {/* Manage link */}
            <div className="flex justify-center mt-2 pt-2 border-t border-gray-200 dark:border-white/[0.06]">
              <button onClick={() => navigate('/tools')} className="text-xs text-primary hover:underline cursor-pointer">
                {t('toolsTitle')} &mdash; Manage
              </button>
            </div>
          </>
        )}
      </Card>

      {/* ============ MY TASKS SECTION (clickable card) ============ */}
      <Card className="cursor-pointer hover:border-primary/30 transition-all mt-auto flex-shrink-0" onClick={() => navigate('/tasks')}>
        <div className="flex items-center gap-2.5">
          {/* Title */}
          <div className="flex items-center gap-2.5 flex-1">
            <i className="fas fa-tasks text-lg text-primary"></i>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 tracking-tight">{t('myTasks')}</h3>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2.5 px-2.5 py-1 bg-gray-100 dark:bg-surface-2 rounded-lg border border-gray-200 dark:border-white/[0.08]">
            <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-white/50">
              <i className="fas fa-file-alt text-[0.6rem] text-primary/60"></i>{taskStats.exam}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-white/50">
              <i className="fas fa-user text-[0.6rem] text-primary/60"></i>{taskStats.individual}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-white/50">
              <i className="fas fa-users text-[0.6rem] text-primary/60"></i>{taskStats.group}
            </span>
          </div>

          {/* Add Button */}
          <button onClick={(e) => { e.stopPropagation(); navigate('/task/add') }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-colors cursor-pointer">
            <i className="fas fa-plus text-xs"></i> {t('add')}
          </button>

          {/* Count Badge */}
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold text-white ${taskStats.total > 0 ? 'bg-primary' : 'bg-gray-300 dark:bg-white/20'}`}>
            {taskStats.total}
          </div>
        </div>
      </Card>
    </div>
  )
}
