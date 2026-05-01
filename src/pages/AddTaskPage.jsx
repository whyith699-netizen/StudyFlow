import { useState, useRef } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useLang } from '../contexts/LanguageContext'
import Card from '../components/Card'
import Button from '../components/Button'
import CustomSelect from '../components/CustomSelect'

// Professional clean input styles
const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors'

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">
      {children}{required && <span className="text-primary ml-0.5">*</span>}
    </label>
  )
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]"></div>
      {label && <span className="text-[10px] font-medium text-gray-400 dark:text-white/30 uppercase tracking-widest">{label}</span>}
      <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]"></div>
    </div>
  )
}

const TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual', icon: 'user' },
  { value: 'group', label: 'Group', icon: 'users' },
  { value: 'exam', label: 'Exam', icon: 'file-alt' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

// File icon based on extension
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const map = {
    pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word',
    xls: 'fa-file-excel', xlsx: 'fa-file-excel', csv: 'fa-file-csv',
    ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint',
    jpg: 'fa-file-image', jpeg: 'fa-file-image', png: 'fa-file-image', gif: 'fa-file-image', webp: 'fa-file-image',
    zip: 'fa-file-archive', rar: 'fa-file-archive', '7z': 'fa-file-archive',
    mp4: 'fa-file-video', mov: 'fa-file-video', avi: 'fa-file-video',
    mp3: 'fa-file-audio', wav: 'fa-file-audio',
    js: 'fa-file-code', py: 'fa-file-code', html: 'fa-file-code', css: 'fa-file-code',
    txt: 'fa-file-alt',
  }
  return map[ext] || 'fa-file'
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Convert date string/object to local ISO string for datetime-local input
// Handles "YYYY-MM-DD" (midnight local) and "YYYY-MM-DDTHH:mm..." (specific time)
function toDateTimeLocal(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  // Adjust for timezone offset to get local time in ISO format
  // new Date(date - timezoneOffset) gives a date object where .toISOString() returns local time in ISO format
  const offset = date.getTimezoneOffset() * 60000
  const localDate = new Date(date.getTime() - offset)
  return localDate.toISOString().slice(0, 16)
}

export default function AddTaskPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { classes, addTask } = useData()
  const { t } = useLang()
  const fileInputRef = useRef(null)

  const [title, setTitle] = useState('')
  const [classId, setClassId] = useState(searchParams.get('classId') || '')
  const [type, setType] = useState('individual')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [links, setLinks] = useState([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [files, setFiles] = useState([])

  const addLink = () => {
    if (newLinkUrl) {
      setLinks(prev => [...prev, { url: newLinkUrl }])
      setNewLinkUrl('')
    }
  }

  const removeLink = (index) => setLinks(prev => prev.filter((_, i) => i !== index))

  const handleFileAdd = (e) => {
    const selectedFiles = Array.from(e.target.files)
    selectedFiles.forEach(file => {
      // Max 5MB per file for storage limits
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" is too large (max 5MB)`)
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        setFiles(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          data: ev.target.result,
          addedAt: new Date().toISOString(),
        }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = '' // Reset input
  }

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      classId, type, priority,
      dueDate: dueDate || null,
      description: description.trim(),
      links: links.length > 0 ? links : [],
      files: files.length > 0 ? files : [],
    })
    navigate(classId ? `/class/${classId}` : '/')
  }

  return (
    <div className="flex flex-col gap-3 overflow-auto h-full max-h-screen pb-2 scrollbar-none">
      <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-surface-1 border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left text-primary"></i>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90">{t('addTaskTitle')}</h1>
        </div>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div>
              <FieldLabel required>{t('taskTitle')}</FieldLabel>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                placeholder={t('taskTitle')} className={inputCls} />
            </div>
            <div>
              <FieldLabel>{t('selectClass')}</FieldLabel>
              <CustomSelect
                value={classId}
                onChange={setClassId}
                options={classes.map(c => ({ value: c.id, label: c.name, icon: `fas fa-${c.icon || 'graduation-cap'}` }))}
                placeholder={t('selectClass')}
                searchable={classes.length > 5}
                icon="fas fa-chalkboard"
              />
            </div>
          </div>

          <Divider label="Type & Priority" />

          <div>
            <FieldLabel>Type</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button type="button" key={opt.value} onClick={() => setType(opt.value)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    type === opt.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-surface-3'
                  }`}>
                  <i className={`fas fa-${opt.icon} text-[10px]`}></i>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Priority</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button type="button" key={opt.value} onClick={() => setPriority(opt.value)}
                  className={`py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    priority === opt.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-surface-3'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Divider label="Details" />

          <div>
            <FieldLabel>{t('dueDate')}</FieldLabel>
            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
          </div>

          <div>
            <FieldLabel>{t('notesOptional')}</FieldLabel>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder={t('notesPlaceholder')} className={`${inputCls} resize-none`} />
          </div>

          <Divider label="Links" />

          <div>
            {links.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {links.map((link, i) => {
                  let hostname = ''
                  try { hostname = new URL(link.url).hostname } catch { hostname = link.url }
                  return (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-surface-2 border border-gray-200 dark:border-white/[0.06]">
                      <i className="fas fa-link text-[10px] text-primary/50"></i>
                      <span className="text-xs text-gray-600 dark:text-white/60 truncate flex-1">{hostname}</span>
                      <button type="button" onClick={() => removeLink(i)}
                        className="text-gray-300 dark:text-white/20 hover:text-red-500 text-xs cursor-pointer transition-colors">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex gap-2">
              <input type="url" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                placeholder="https://..." className={`flex-1 ${inputCls} !text-xs !py-1.5`} />
              <button type="button" onClick={addLink}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs cursor-pointer hover:bg-primary-dark transition-colors">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <Divider label="Attachments" />

          <div>
            {files.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-surface-2 border border-gray-200 dark:border-white/[0.06]">
                    <i className={`fas ${getFileIcon(file.name)} text-sm text-primary/60`}></i>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-white/60 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/30">{formatFileSize(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(i)}
                      className="text-gray-300 dark:text-white/20 hover:text-red-500 text-xs cursor-pointer transition-colors">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileAdd} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-white/[0.12] text-gray-400 dark:text-white/40 text-xs font-medium hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary cursor-pointer transition-colors flex items-center justify-center gap-2">
              <i className="fas fa-cloud-upload-alt text-sm"></i> Upload File
              <span className="text-gray-300 dark:text-white/20">(max 5MB)</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-white/[0.06]">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/50 text-sm font-medium hover:bg-gray-50 dark:hover:bg-surface-2 cursor-pointer transition-colors">
              {t('cancel')}
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary-dark cursor-pointer transition-colors flex items-center justify-center gap-2">
              <i className="fas fa-plus text-xs"></i> {t('addTask')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// ==========================================
// EDIT TASK PAGE
// ==========================================
export function EditTaskPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { classes, tasks, editTask, deleteTask, toggleTask } = useData()
  const { t } = useLang()
  const task = tasks.find(t => t.id === id)
  const fileInputRef = useRef(null)

  const [title, setTitle] = useState(task?.title || '')
  const [classId, setClassId] = useState(task?.classId || '')
  const [type, setType] = useState(task?.type || 'individual')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.dueDate ? toDateTimeLocal(task.dueDate) : '')
  const [description, setDescription] = useState(task?.description || '')
  const [links, setLinks] = useState(task?.links || [])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [files, setFiles] = useState(task?.files || [])

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-white/40">
        <i className="fas fa-search text-2xl mb-3 text-gray-300 dark:text-white/20"></i>
        <p className="text-sm font-medium">{t('noTasks')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-xs text-primary hover:text-primary-dark cursor-pointer transition-colors">{t('goBack')}</button>
      </div>
    )
  }

  const addLink = () => {
    if (newLinkUrl) {
      setLinks(prev => [...prev, { url: newLinkUrl }])
      setNewLinkUrl('')
    }
  }

  const removeLink = (index) => setLinks(prev => prev.filter((_, i) => i !== index))

  const handleFileAdd = (e) => {
    const selectedFiles = Array.from(e.target.files)
    selectedFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" is too large (max 5MB)`)
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        setFiles(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          data: ev.target.result,
          addedAt: new Date().toISOString(),
        }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index))

  const downloadFile = (file) => {
    const a = document.createElement('a')
    a.href = file.data
    a.download = file.name
    a.click()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    editTask(id, {
      title: title.trim(), classId, type, priority,
      dueDate: dueDate || null,
      description: description.trim(),
      links: links.length > 0 ? links : [],
      files: files.length > 0 ? files : [],
    })
    navigate(-1)
  }

  const selectedClass = classes.find(c => c.id === classId)

  return (
    <div className="flex flex-col gap-3 overflow-auto h-full max-h-screen pb-2 scrollbar-none">
      <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-surface-1 border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left text-primary"></i>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90">{t('editTaskTitle')}</h1>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => { toggleTask(id); navigate(-1) }} title={task.completed ? t('markPending') : t('markComplete')}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-surface-3 cursor-pointer transition-colors">
            <i className={`fas ${task.completed ? 'fa-undo' : 'fa-check'} text-xs`}></i>
          </button>
          <button onClick={() => { deleteTask(id); navigate(-1) }}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800/30 cursor-pointer transition-colors">
            <i className="fas fa-trash text-xs"></i>
          </button>
        </div>
      </header>

      {/* Status indicator */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/15 dark:border-primary/20">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.completed ? 'bg-emerald-500' : 'bg-primary'}`}></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white/85 truncate">{title || 'Task Title'}</p>
          <p className="text-[11px] text-gray-400 dark:text-white/40">
            {task.completed ? t('completedLabel') : t('pendingLabel')}
            {selectedClass ? ` · ${selectedClass.name}` : ''}
            {dueDate ? ` · Due ${new Date(dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div>
              <FieldLabel required>{t('taskTitle')}</FieldLabel>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <FieldLabel>{t('selectClass')}</FieldLabel>
              <CustomSelect
                value={classId}
                onChange={setClassId}
                options={classes.map(c => ({ value: c.id, label: c.name, icon: `fas fa-${c.icon || 'graduation-cap'}` }))}
                placeholder={t('selectClass')}
                searchable={classes.length > 5}
                icon="fas fa-chalkboard"
              />
            </div>
          </div>

          <Divider label="Type & Priority" />

          <div>
            <FieldLabel>Type</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button type="button" key={opt.value} onClick={() => setType(opt.value)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    type === opt.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-surface-3'
                  }`}>
                  <i className={`fas fa-${opt.icon} text-[10px]`}></i>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Priority</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button type="button" key={opt.value} onClick={() => setPriority(opt.value)}
                  className={`py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    priority === opt.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-surface-2 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-surface-3'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Divider label="Details" />

          <div>
            <FieldLabel>{t('dueDate')}</FieldLabel>
            <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
          </div>

          <div>
            <FieldLabel>{t('notesOptional')}</FieldLabel>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder={t('notesPlaceholder')} className={`${inputCls} resize-none`} />
          </div>

          <Divider label="Links" />

          <div>
            {links.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {links.map((link, i) => {
                  let hostname = ''
                  try { hostname = new URL(link.url).hostname } catch { hostname = link.url }
                  return (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-surface-2 border border-gray-200 dark:border-white/[0.06]">
                      <i className="fas fa-link text-[10px] text-primary/50"></i>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gray-600 dark:text-white/60 truncate flex-1 hover:text-primary transition-colors no-underline">
                        {hostname}
                      </a>
                      <button type="button" onClick={() => removeLink(i)}
                        className="text-gray-300 dark:text-white/20 hover:text-red-500 text-xs cursor-pointer transition-colors">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex gap-2">
              <input type="url" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
                placeholder="https://..." className={`flex-1 ${inputCls} !text-xs !py-1.5`} />
              <button type="button" onClick={addLink}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs cursor-pointer hover:bg-primary-dark transition-colors">
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <Divider label="Attachments" />

          <div>
            {files.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-surface-2 border border-gray-200 dark:border-white/[0.06] group">
                    <i className={`fas ${getFileIcon(file.name)} text-sm text-primary/60`}></i>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 dark:text-white/60 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/30">{formatFileSize(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => downloadFile(file)}
                      className="text-gray-300 dark:text-white/20 hover:text-primary text-xs cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
                      <i className="fas fa-download"></i>
                    </button>
                    <button type="button" onClick={() => removeFile(i)}
                      className="text-gray-300 dark:text-white/20 hover:text-red-500 text-xs cursor-pointer transition-colors">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileAdd} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-white/[0.12] text-gray-400 dark:text-white/40 text-xs font-medium hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary cursor-pointer transition-colors flex items-center justify-center gap-2">
              <i className="fas fa-cloud-upload-alt text-sm"></i> Upload File
              <span className="text-gray-300 dark:text-white/20">(max 5MB)</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-white/[0.06]">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/50 text-sm font-medium hover:bg-gray-50 dark:hover:bg-surface-2 cursor-pointer transition-colors">
              {t('cancel')}
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium shadow-sm hover:bg-primary-dark cursor-pointer transition-colors flex items-center justify-center gap-2">
              <i className="fas fa-check text-xs"></i> {t('saveTask')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
