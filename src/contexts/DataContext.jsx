import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from './AuthContext'
import * as sync from '../services/syncService'
import { mergeStudyTools, normalizeCustomStudyTools } from '../config/studyTools'

const DataContext = createContext()

// Normalize day names from Firestore (lowercase/Indonesian -> Capitalized English)
const DAY_MAP = {
  senin: 'Monday', selasa: 'Tuesday', rabu: 'Wednesday',
  kamis: 'Thursday', jumat: 'Friday', sabtu: 'Saturday', minggu: 'Sunday',
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

function normalizeClass(cls) {
  if (!cls) return cls
  const normalized = { ...cls }
  if (Array.isArray(normalized.days)) {
    normalized.days = normalized.days.map((d) => DAY_MAP[d?.toLowerCase?.()] || d)
  }
  return normalized
}

function normalizeClasses(classes) {
  return classes.map(normalizeClass)
}

// Normalize task fields from old Firestore format to new React format
const TYPE_MAP = {
  exam: 'exam', 'daily quiz': 'exam', 'ulangan harian': 'exam',
  'individual task': 'individual', 'tugas individu': 'individual',
  'group task': 'group', 'tugas kelompok': 'group',
  other: 'other',
}

function normalizeTask(task, classes) {
  if (!task) return task
  const normalized = { ...task }

  if (!normalized.type && normalized.text) {
    normalized.type = TYPE_MAP[normalized.text.toLowerCase()] || 'other'
  }

  if (!normalized.title && normalized.text) {
    normalized.title = normalized.text
  }

  if (!normalized.dueDate && normalized.deadline) {
    normalized.dueDate = normalized.deadline
  }

  if (!normalized.classId && normalized.className && Array.isArray(classes)) {
    const match = classes.find((c) => c.name?.toLowerCase() === normalized.className.toLowerCase())
    if (match) normalized.classId = match.id
  }

  return normalized
}

function normalizeTasks(tasks, classes) {
  return tasks.map((t) => normalizeTask(t, classes))
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [tasks, setTasks] = useState([])
  const [customStudyTools, setCustomStudyTools] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const unsubRef = useRef(null)

  const studyTools = useMemo(() => mergeStudyTools(customStudyTools), [customStudyTools])

  const saveLocal = useCallback((newClasses, newTasks, newStudyTools) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) return
    const data = {}
    if (newClasses !== undefined) data.myClasses = newClasses
    if (newTasks !== undefined) data.tasks = newTasks
    if (newStudyTools !== undefined) data.studyTools = newStudyTools
    chrome.storage.local.set(data)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      if (user) {
        const [rawClasses, cloudTasks, cloudStudyTools] = await Promise.all([
          sync.getClasses(user.uid),
          sync.getTasks(user.uid),
          sync.getStudyTools(user.uid),
        ])

        const cloudClasses = normalizeClasses(rawClasses)
        const normalizedTasks = normalizeTasks(cloudTasks, cloudClasses)
        const normalizedStudyTools = normalizeCustomStudyTools(cloudStudyTools)

        setClasses(cloudClasses)
        setTasks(normalizedTasks)
        setCustomStudyTools(normalizedStudyTools)
        saveLocal(cloudClasses, normalizedTasks, normalizedStudyTools)

        if (unsubRef.current) unsubRef.current()
        unsubRef.current = sync.listenForChanges(user.uid, async () => {
          const [rawC, t, tools] = await Promise.all([
            sync.getClasses(user.uid),
            sync.getTasks(user.uid),
            sync.getStudyTools(user.uid),
          ])

          const normalizedClasses = normalizeClasses(rawC)
          const normalizedTasksNext = normalizeTasks(t, normalizedClasses)
          const normalizedTools = normalizeCustomStudyTools(tools)

          setClasses(normalizedClasses)
          setTasks(normalizedTasksNext)
          setCustomStudyTools(normalizedTools)
          saveLocal(normalizedClasses, normalizedTasksNext, normalizedTools)
        })
      } else if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['myClasses', 'tasks', 'studyTools'], (result) => {
          if (!chrome.runtime.lastError) {
            const normalizedClasses = normalizeClasses(result.myClasses || [])
            setClasses(normalizedClasses)
            setTasks(normalizeTasks(result.tasks || [], normalizedClasses))
            setCustomStudyTools(normalizeCustomStudyTools(result.studyTools || []))
          }
          setIsLoading(false)
        })
        return
      } else {
        setClasses([])
        setTasks([])
        setCustomStudyTools([])
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['myClasses', 'tasks', 'studyTools'], (result) => {
          const normalizedClasses = normalizeClasses(result.myClasses || [])
          setClasses(normalizedClasses)
          setTasks(normalizeTasks(result.tasks || [], normalizedClasses))
          setCustomStudyTools(normalizeCustomStudyTools(result.studyTools || []))
        })
      }
    }
    setIsLoading(false)
  }, [saveLocal, user])

  useEffect(() => {
    loadData()
    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [loadData])

  // ==========================================
  // CLASSES
  // ==========================================

  const addClass = useCallback(async (newClass) => {
    const id = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const cls = { ...newClass, id }
    setClasses((prev) => [...prev, cls])
    try {
      if (user) await sync.addClassToCloud(user.uid, cls)
      saveLocal([...classes, cls], undefined, undefined)
    } catch (err) {
      console.error('Failed to add class:', err)
    }
  }, [classes, saveLocal, user])

  const editClass = useCallback(async (id, updatedClass) => {
    const updated = classes.map((c) => (c.id === id ? { ...c, ...updatedClass } : c))
    setClasses(updated)
    try {
      if (user) await sync.updateClassInCloud(user.uid, id, updatedClass)
      saveLocal(updated, undefined, undefined)
    } catch (err) {
      console.error('Failed to edit class:', err)
    }
  }, [classes, saveLocal, user])

  const deleteClass = useCallback(async (id) => {
    const updated = classes.filter((c) => c.id !== id)
    const updatedTasks = tasks.filter((t) => t.classId !== id)
    setClasses(updated)
    setTasks(updatedTasks)
    try {
      if (user) {
        await sync.deleteClassFromCloud(user.uid, id)
        const classTasks = tasks.filter((t) => t.classId === id)
        for (const task of classTasks) {
          await sync.deleteTaskFromCloud(user.uid, task.id)
        }
      }
      saveLocal(updated, updatedTasks, undefined)
    } catch (err) {
      console.error('Failed to delete class:', err)
    }
  }, [classes, saveLocal, tasks, user])

  const reorderClasses = useCallback((newOrder) => {
    setClasses(newOrder)
    saveLocal(newOrder, undefined, undefined)
  }, [saveLocal])

  // ==========================================
  // TASKS
  // ==========================================

  const scheduleReminder = (taskId, dueDate) => {
    if (typeof chrome !== 'undefined' && chrome.alarms && dueDate) {
      const alarmName = `task-reminder-${taskId}`
      const dueTime = new Date(dueDate).getTime()
      chrome.alarms.clear(alarmName)

      if (dueTime > Date.now()) {
        chrome.alarms.create(alarmName, { when: dueTime })
        console.log(`[Alarm] Scheduled for task ${taskId} at ${new Date(dueTime).toLocaleString()}`)
      }
    }
  }

  const clearReminder = (taskId) => {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      chrome.alarms.clear(`task-reminder-${taskId}`)
    }
  }

  const addTask = useCallback(async (newTask) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const task = { ...newTask, id, completed: false }
    setTasks((prev) => [...prev, task])
    try {
      if (user) await sync.addTaskToCloud(user.uid, task)
      saveLocal(undefined, [...tasks, task], undefined)

      if (task.dueDate) {
        scheduleReminder(task.id, task.dueDate)
      }
    } catch (err) {
      console.error('Failed to add task:', err)
    }
  }, [saveLocal, tasks, user])

  const editTask = useCallback(async (id, updatedTask) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updatedTask } : t))
    setTasks(updated)
    try {
      if (user) await sync.updateTaskInCloud(user.uid, id, updatedTask)
      saveLocal(undefined, updated, undefined)

      const task = tasks.find((t) => t.id === id)
      const newDueDate = updatedTask.dueDate !== undefined ? updatedTask.dueDate : task?.dueDate
      const isCompleted = updatedTask.completed !== undefined ? updatedTask.completed : task?.completed

      if (!isCompleted && newDueDate) {
        scheduleReminder(id, newDueDate)
      } else {
        clearReminder(id)
      }
    } catch (err) {
      console.error('Failed to edit task:', err)
    }
  }, [saveLocal, tasks, user])

  const deleteTask = useCallback(async (id) => {
    const updated = tasks.filter((t) => t.id !== id)
    setTasks(updated)
    try {
      if (user) await sync.deleteTaskFromCloud(user.uid, id)
      saveLocal(undefined, updated, undefined)
      clearReminder(id)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }, [saveLocal, tasks, user])

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    setTasks(updated)
    try {
      if (user) await sync.updateTaskInCloud(user.uid, id, { completed: !task.completed })
      saveLocal(undefined, updated, undefined)

      if (!task.completed) {
        clearReminder(id)
      } else if (task.dueDate) {
        scheduleReminder(id, task.dueDate)
      }
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }, [saveLocal, tasks, user])

  // ==========================================
  // STUDY TOOLS
  // ==========================================

  const persistStudyTools = useCallback(async (nextTools) => {
    const normalized = normalizeCustomStudyTools(nextTools)
    setCustomStudyTools(normalized)
    saveLocal(undefined, undefined, normalized)

    if (user) {
      await sync.saveStudyTools(user.uid, normalized)
    }
  }, [saveLocal, user])

  const addStudyTool = useCallback(async (toolData) => {
    const timestamp = Date.now()
    const nextTools = [
      ...customStudyTools,
      {
        ...toolData,
        id: `tool_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        isDefault: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]

    await persistStudyTools(nextTools)
  }, [customStudyTools, persistStudyTools])

  const editStudyTool = useCallback(async (id, updates) => {
    const nextTools = customStudyTools.map((tool) => (
      tool.id === id
        ? { ...tool, ...updates, updatedAt: Date.now() }
        : tool
    ))

    await persistStudyTools(nextTools)
  }, [customStudyTools, persistStudyTools])

  const deleteStudyTool = useCallback(async (id) => {
    const nextTools = customStudyTools.filter((tool) => tool.id !== id)
    await persistStudyTools(nextTools)
  }, [customStudyTools, persistStudyTools])

  return (
    <DataContext.Provider value={{
      classes,
      tasks,
      studyTools,
      customStudyTools,
      isLoading,
      loadData,
      addClass,
      editClass,
      deleteClass,
      reorderClasses,
      addTask,
      editTask,
      deleteTask,
      toggleTask,
      addStudyTool,
      editStudyTool,
      deleteStudyTool,
    }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}

export default DataContext
