/**
 * Sync Service - Firestore CRUD operations
 * Ported from old sync-service.js using modular Firebase SDK
 */
import { db } from './firebase'
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch,
  serverTimestamp, onSnapshot
} from 'firebase/firestore'

// ==========================================
// CLASSES
// ==========================================

export async function getClasses(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'classes'))
  const classes = []
  snap.forEach(d => {
    const data = d.data()
    delete data.updatedAt
    classes.push(data)
  })
  return classes.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export async function addClassToCloud(userId, classData) {
  const classId = classData.id || `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newClass = { ...classData, id: classId }
  await setDoc(doc(db, 'users', userId, 'classes', classId), {
    ...newClass, updatedAt: serverTimestamp()
  })
  return newClass
}

export async function updateClassInCloud(userId, classId, updates) {
  await updateDoc(doc(db, 'users', userId, 'classes', classId), {
    ...updates, updatedAt: serverTimestamp()
  })
}

export async function deleteClassFromCloud(userId, classId) {
  await deleteDoc(doc(db, 'users', userId, 'classes', classId))
}

// ==========================================
// TASKS
// ==========================================

export async function getTasks(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'tasks'))
  const tasks = []
  snap.forEach(d => {
    const data = d.data()
    delete data.updatedAt
    tasks.push(data)
  })
  return tasks
}

export async function addTaskToCloud(userId, taskData) {
  const taskId = taskData.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newTask = { ...taskData, id: taskId }
  await setDoc(doc(db, 'users', userId, 'tasks', taskId), {
    ...newTask, updatedAt: serverTimestamp()
  })
  return newTask
}

export async function updateTaskInCloud(userId, taskId, updates) {
  await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
    ...updates, updatedAt: serverTimestamp()
  })
}

export async function deleteTaskFromCloud(userId, taskId) {
  await deleteDoc(doc(db, 'users', userId, 'tasks', taskId))
}

// ==========================================
// STUDY TOOLS
// ==========================================

export async function getStudyTools(userId) {
  const studyToolsRef = doc(db, 'users', userId, 'settings', 'studyTools')
  const snap = await getDoc(studyToolsRef)
  if (!snap.exists()) return []

  const data = snap.data()
  return Array.isArray(data?.items) ? data.items : []
}

export async function saveStudyTools(userId, items) {
  await setDoc(
    doc(db, 'users', userId, 'settings', 'studyTools'),
    {
      items,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// ==========================================
// FULL SYNC
// ==========================================

export async function syncToCloud(userId, classes, tasks) {
  const batch = writeBatch(db)
  const userRef = doc(db, 'users', userId)

  for (const cls of classes) {
    batch.set(doc(db, 'users', userId, 'classes', cls.id), {
      ...cls, updatedAt: serverTimestamp()
    }, { merge: true })
  }
  for (const task of tasks) {
    const taskId = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    task.id = taskId
    batch.set(doc(db, 'users', userId, 'tasks', taskId), {
      ...task, updatedAt: serverTimestamp()
    }, { merge: true })
  }

  await batch.commit()
  console.log('[SYNC] Data synced to cloud successfully')
}

export async function syncFromCloud(userId) {
  const classes = await getClasses(userId)
  const tasks = await getTasks(userId)
  return { classes, tasks }
}

// ==========================================
// REALTIME LISTENER
// ==========================================

export function listenForChanges(userId, onClassesChange) {
  return onSnapshot(
    collection(db, 'users', userId, 'classes'),
    (snapshot) => {
      if (!snapshot.metadata.hasPendingWrites) {
        onClassesChange()
      }
    },
    (err) => console.error('[SYNC] Realtime sync error:', err)
  )
}

// ==========================================
// USER PROFILE
// ==========================================

export async function createUserProfile(userId, userData) {
  const userRef = doc(db, 'users', userId)
  const existing = await getDoc(userRef)
  const { createdAt: _ignoredCreatedAt, ...safeUserData } = userData || {}
  const payload = {
    ...safeUserData,
    updatedAt: serverTimestamp(),
    lastSync: serverTimestamp()
  }

  if (!existing.exists()) {
    payload.createdAt = serverTimestamp()
  }

  await setDoc(userRef, payload, { merge: true })
}
