/**
 * apiService.js — HTTP client untuk StudyFlow API (MariaDB backend)
 *
 * Semua request otomatis menyertakan Firebase ID Token sebagai Bearer token.
 * Digunakan pada Fase 2 (dual-write) dan seterusnya.
 */
import { auth } from './firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// ── Token Helper ─────────────────────────────────────────────────────────────

/**
 * Ambil Firebase ID Token yang masih valid.
 * @returns {Promise<string|null>}
 */
async function getIdToken() {
  try {
    const user = auth.currentUser
    if (!user) return null
    return await user.getIdToken(/* forceRefresh */ false)
  } catch (err) {
    console.warn('[API] Gagal mengambil ID token:', err.message)
    return null
  }
}

/**
 * Wrapper fetch ke API dengan auto-inject Authorization header.
 * @param {string} path   — path tanpa base URL, contoh: '/api/users'
 * @param {object} options — fetch options
 */
async function apiFetch(path, options = {}) {
  const token = await getIdToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `API error ${res.status}`)
  }

  // 204 No Content
  if (res.status === 204) return null

  return res.json()
}

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * Upsert profil user ke MariaDB. Dipanggil saat login/register.
 */
export async function apiCreateUserProfile(userData) {
  return apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

/**
 * Ambil profil user dari MariaDB.
 */
export async function apiGetUserProfile(userId) {
  return apiFetch(`/api/users/${userId}`)
}

// ── Classes ───────────────────────────────────────────────────────────────────

export async function apiGetClasses(userId) {
  return apiFetch(`/api/classes/${userId}`)
}

export async function apiAddClass(userId, classData) {
  return apiFetch('/api/classes', {
    method: 'POST',
    body: JSON.stringify({ ...classData, userId }),
  })
}

export async function apiUpdateClass(classId, updates) {
  return apiFetch(`/api/classes/${classId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function apiDeleteClass(classId) {
  return apiFetch(`/api/classes/${classId}`, { method: 'DELETE' })
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function apiGetTasks(userId) {
  return apiFetch(`/api/tasks/${userId}`)
}

export async function apiAddTask(userId, taskData) {
  return apiFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ ...taskData, userId }),
  })
}

export async function apiUpdateTask(taskId, updates) {
  return apiFetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function apiDeleteTask(taskId) {
  return apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
}

// ── Study Tools ───────────────────────────────────────────────────────────────

export async function apiGetStudyTools(userId) {
  return apiFetch(`/api/study-tools/${userId}`)
}

/**
 * Replace seluruh daftar study tools (bulk upsert).
 * @param {string} userId
 * @param {Array}  items  — array of tool objects
 */
export async function apiSaveStudyTools(userId, items) {
  return apiFetch(`/api/study-tools/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

export async function apiDeleteStudyTool(userId, toolId) {
  return apiFetch(`/api/study-tools/${userId}/${toolId}`, { method: 'DELETE' })
}
