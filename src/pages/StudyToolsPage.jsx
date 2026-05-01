import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { buildFaviconUrl, isValidStudyToolUrl } from '../config/studyTools'
import Card, { CardHeader } from '../components/Card'
import Button from '../components/Button'
import Modal, { ConfirmDialog } from '../components/Modal'
import SearchInput from '../components/SearchInput'

const EMPTY_FORM = {
  name: '',
  description: '',
  launchUrl: '',
}

function resolveToolName(tool, t) {
  return tool.name || (tool.nameKey ? t(tool.nameKey) : '')
}

function resolveToolDescription(tool, t) {
  return tool.description || (tool.descKey ? t(tool.descKey) : '')
}

function openExternalUrl(url) {
  if (!url) return

  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url })
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

function ToolLogo({ tool }) {
  const [imageFailed, setImageFailed] = useState(false)
  const logoUrl = imageFailed ? '' : (tool.logoUrl || buildFaviconUrl(tool.launchUrl))

  return (
    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center border border-blue-500/30 shadow-sm overflow-hidden flex-shrink-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="w-6 h-6 object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <i className={`fas ${tool.icon || 'fa-globe'} text-sm`} />
      )}
    </div>
  )
}

export default function StudyToolsPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { studyTools, isLoading, addStudyTool, editStudyTool, deleteStudyTool } = useData()
  const { t } = useLang()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTool, setEditingTool] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return studyTools

    return studyTools.filter((tool) => {
      const name = resolveToolName(tool, t).toLowerCase()
      const description = resolveToolDescription(tool, t).toLowerCase()
      return name.includes(query) || description.includes(query) || tool.launchUrl.toLowerCase().includes(query)
    })
  }, [searchQuery, studyTools, t])

  const customCount = studyTools.filter((tool) => !tool.isDefault).length

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTool(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setIsSaving(false)
  }

  const openCreateModal = () => {
    if (!isLoggedIn) return
    setEditingTool(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (tool) => {
    setEditingTool(tool)
    setForm({
      name: tool.name || '',
      description: tool.description || '',
      launchUrl: tool.launchUrl || '',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isLoggedIn) {
      setFormError(t('toolsLoginRequired'))
      return
    }

    const cleanName = form.name.trim()
    const cleanDescription = form.description.trim()
    const cleanUrl = form.launchUrl.trim()

    if (!cleanName) {
      setFormError(t('toolsValidationName'))
      return
    }

    if (!isValidStudyToolUrl(cleanUrl)) {
      setFormError(t('toolsValidationLaunchUrl'))
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      const payload = {
        name: cleanName,
        description: cleanDescription,
        launchUrl: cleanUrl,
        logoUrl: buildFaviconUrl(cleanUrl),
        icon: 'fa-globe',
      }

      if (editingTool) {
        await editStudyTool(editingTool.id, payload)
      } else {
        await addStudyTool(payload)
      }

      closeModal()
    } catch (error) {
      console.error('Failed to save study tool:', error)
      setFormError(t('toolsSaveFailed'))
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return

    try {
      await deleteStudyTool(pendingDelete.id)
    } catch (error) {
      console.error('Failed to delete study tool:', error)
    }
  }

  return (
    <div className="flex flex-col gap-3 overflow-hidden h-full max-h-screen pb-0.5">
      <Card className="flex-1 min-h-0">
        <CardHeader icon="fa-globe" title={t('toolsTitle')}>
          <Button variant="icon" onClick={() => navigate('/')} title={t('goBack')}>
            <i className="fas fa-arrow-left text-xs"></i>
          </Button>
        </CardHeader>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">
              {t('toolsSubtitle')}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px]">
              <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20">
                {t('toolsDirectOnly')}
              </span>
              <span className="text-gray-500 dark:text-white/40">
                {t('toolsCustomCount', { n: customCount })}
              </span>
            </div>
          </div>
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder={t('search')} />
        </div>

        {!isLoggedIn && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            {t('toolsLoginRequired')}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-xs text-gray-500 dark:text-white/40">
            {t('toolsOpenHint')}
          </div>
          <Button variant="primary" onClick={openCreateModal} disabled={!isLoggedIn}>
            <i className="fas fa-plus text-xs"></i>
            {t('toolsAddCustom')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-500 dark:text-white/50">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            {t('toolsLoading')}
          </div>
        ) : filteredTools.length > 0 ? (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
            {filteredTools.map((tool) => {
              const toolName = resolveToolName(tool, t)
              const toolDescription = resolveToolDescription(tool, t)

              return (
                <div
                  key={tool.id}
                  className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/90 dark:bg-surface-2/70 px-3 py-3 flex items-start gap-3"
                >
                  <ToolLogo tool={tool} />

                  <button
                    type="button"
                    onClick={() => openExternalUrl(tool.launchUrl)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                        {toolName}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        tool.isDefault
                          ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-white/50 dark:border-white/[0.08]'
                          : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20'
                      }`}
                      >
                        {tool.isDefault ? t('toolsDefaultBadge') : t('toolsCustomBadge')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed line-clamp-2">
                      {toolDescription}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1 truncate">
                      {tool.launchUrl}
                    </p>
                  </button>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!tool.isDefault && (
                      <>
                        <Button variant="icon" onClick={() => openEditModal(tool)} title={t('toolsEditCustom')}>
                          <i className="fas fa-pen text-[11px]"></i>
                        </Button>
                        <Button variant="icon" onClick={() => setPendingDelete(tool)} title={t('toolsDeleteCustom')}>
                          <i className="fas fa-trash text-[11px]"></i>
                        </Button>
                      </>
                    )}
                    <Button variant="primary" onClick={() => openExternalUrl(tool.launchUrl)}>
                      <i className="fas fa-arrow-up-right-from-square text-[11px]"></i>
                      {t('toolOpen')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-500 dark:text-white/50 text-center px-6">
            {t('toolsEmptyState')}
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTool ? t('toolsEditTitle') : t('toolsAddTitle')}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-white/45 leading-relaxed">
            {t('toolsModalSubtitle')}
          </p>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">
              {t('toolsFieldName')}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={t('toolsFieldNamePlaceholder')}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">
              {t('toolsFieldDescription')}
            </label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={t('toolsFieldDescriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">
              {t('toolsFieldLaunchUrl')}
            </label>
            <input
              type="url"
              value={form.launchUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, launchUrl: event.target.value }))}
              placeholder="https://"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-2 text-gray-800 dark:text-white/90 text-sm shadow-sm placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          <p className="text-[11px] text-gray-400 dark:text-white/35 leading-relaxed">
            {t('toolsAutoLogoHint')}
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={closeModal}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" disabled={isSaving}>
              {isSaving && <i className="fas fa-spinner fa-spin text-xs"></i>}
              {editingTool ? t('saveChanges') : t('toolsAddCustom')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title={t('toolsDeleteTitle')}
        message={t('toolsDeleteMessage', { name: pendingDelete ? resolveToolName(pendingDelete, t) : '' })}
        confirmText={t('delete')}
        variant="danger"
      />
    </div>
  )
}
