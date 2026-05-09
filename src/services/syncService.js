/**
 * syncService.js — Firestore CRUD operations + Dual-Write ke MariaDB API
 *
 * FASE 2: Setiap operasi tulis dilakukan ke Firestore (PRIMER) dan
 *         MariaDB via API (SEKUNDER, non-blocking).
 *
 * Porting dari old sync-service.js menggunakan modular Firebase SDK.
 */
import { db } from './firebase'
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch,
  serverTimestamp, onSnapshot
} from 'firebase/firestore'
import * as api from './apiService'

// ──────────────────────────────────────────────────────────────────────────────
// FEATURE FLAG: set ke true untuk mengaktifkan dual-write ke MariaDB
// Akan dibalik ke false saat Fase 5 (Firestore dihapus sepenuhnya)
// ──────────────────────────────────────────────────────────────────────────────
const DUAL_WRITE_ENABLED = true

/**
 * Fire-and-forget dual-write — error tidak memblokir operasi Firestore.
 * @param {Function} fn — async function yang memanggil API
 * @param {string}   label — label untuk logging
 */
function dualWrite(fn, label = '') {
  if (!DUAL_WRITE_ENABLED) return
  Promise.resolve().then(fn).catch(err =>
    console.warn(`[DUAL-WRITE] ${label} gagal (non-fatal):`, err.message)
  )
}

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

  // 1. Tulis ke Firestore (PRIMER)
  await setDoc(doc(db, 'users', userId, 'classes', classId), {
    ...newClass, updatedAt: serverTimestamp()
  })

  // 2. Dual-write ke MariaDB (SEKUNDER, non-blocking)
  dualWrite(() => api.apiAddClass(userId, newClass), 'addClassToCloud')

  return newClass
}

export async function updateClassInCloud(userId, classId, updates) {
  // 1. Update Firestore
  await updateDoc(doc(db, 'users', userId, 'classes', classId), {
    ...updates, updatedAt: serverTimestamp()
  })

  // 2. Dual-write ke MariaDB
  dualWrite(() => api.apiUpdateClass(classId, updates), 'updateClassInCloud')
}

export async function deleteClassFromCloud(userId, classId) {
  // 1. Hapus dari Firestore
  await deleteDoc(doc(db, 'users', userId, 'classes', classId))

  // 2. Dual-write ke MariaDB
  dualWrite(() => api.apiDeleteClass(classId), 'deleteClassFromCloud')
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

  // 1. Tulis ke Firestore
  await setDoc(doc(db, 'users', userId, 'tasks', taskId), {
    ...newTask, updatedAt: serverTimestamp()
  })

  // 2. Dual-write ke MariaDB
  dualWrite(() => api.apiAddTask(userId, newTask), 'addTaskToCloud')

  return newTask
}

export async function updateTaskInCloud(userId, taskId, updates) {
  // 1. Update Firestore
  await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
    ...updates, updatedAt: serverTimestamp()
  })

  // 2. Dual-write ke MariaDB
  dualWrite(() => api.apiUpdateTask(taskId, updates), 'updateTaskInCloud')
}

export async function deleteTaskFromCloud(userId, taskId) {
  // 1. Hapus dari Firestore
  await deleteDoc(doc(db, 'users', userId, 'tasks', taskId))

  // 2. Dual-write ke MariaDB
  dualWrite(() => api.apiDeleteTask(taskId), 'deleteTaskFromCloud')
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
  // 1. Simpan ke Firestore
  await setDoc(
    doc(db, 'users', userId, 'settings', 'studyTools'),
    { items, updatedAt: serverTimestamp() },
    { merge: true }
  )

  // 2. Dual-write ke MariaDB
  dualWrite(() => api.apiSaveStudyTools(userId, items), 'saveStudyTools')
}

// ==========================================
// FULL SYNC
// ==========================================

export async function syncToCloud(userId, classes, tasks) {
  const batch = writeBatch(db)

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
  // 1. Simpan ke Firestore
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

  // 2. Dual-write ke MariaDB
  dualWrite(
    () => api.apiCreateUserProfile({
      uid: userId,
      email: userData?.email,
      displayName: userData?.displayName,
      photoURL: userData?.photoURL,
      lastLogin: userData?.lastLogin,
    }),
    'createUserProfile'
  )
}
