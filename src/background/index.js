/**
 * Background Service Worker for Study Dashboard Extension
 * Handles alarms, notifications, and tab tracking
 */

// Listen for extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Study Dashboard installed!')
// ... existing code ...
  }
})

import { db, auth } from '../services/firebase'
import { doc, updateDoc, setDoc, increment, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { focusService } from '../services/focus-service'

// Alarm for task reminders
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('task-reminder-')) {
    const taskId = alarm.name.replace('task-reminder-', '')
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || []
      const task = tasks.find(t => t.id === taskId)
      if (task && !task.completed) {
        chrome.notifications.create(`task-${taskId}`, {
          type: 'basic',
          iconUrl: 'assets/icons/study 128.png',
          title: 'Task Reminder',
          message: `"${task.title}" is due soon!`,
        })
      }
    })
  }
})

// Track active tab for study time
let activeTabStart = null
let activeUrl = ''

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    trackTab(tab.url)
  } catch (e) { /* tab may not exist */ }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    trackTab(tab.url)
  }
})



let currentUser = null
let focusListenerUnsubscribe = null

// Monitor Auth State
onAuthStateChanged(auth, (user) => {
  currentUser = user
  if (user) {
    console.log('Background: User authenticated:', user.uid)
    // Listen for Focus Mode changes from Cloud (Task 3)
    setupFocusListener(user.uid)
  } else {
    console.log('Background: User signed out')
    if (focusListenerUnsubscribe) {
      focusListenerUnsubscribe()
      focusListenerUnsubscribe = null
    }
  }
})

function setupFocusListener(uid) {
  if (focusListenerUnsubscribe) focusListenerUnsubscribe()
  
  const userRef = doc(db, 'users', uid)
  focusListenerUnsubscribe = onSnapshot(userRef, (doc) => {
    const data = doc.data()
    // Check if focus mode is enabled in settings
    if (data?.settings?.focusMode?.enabled) {
      const blocklist = data.settings.focusMode.blocklist || []
      focusService.enableFocusMode(blocklist)
    } else {
      focusService.disableFocusMode()
    }
  })
}

function syncStudyTime(elapsed) {
  if (!currentUser) return

  const userRef = doc(db, 'users', currentUser.uid)
  
  setDoc(userRef, { 
    totalStudyTime: increment(elapsed),
    lastStudySession: serverTimestamp()
  }, { merge: true }).catch(err => {
    console.error('Failed to sync study time:', err)
  })
}

function trackTab(url) {
  if (activeTabStart && activeUrl) {
    const elapsed = Math.round((Date.now() - activeTabStart) / 1000)
    if (elapsed > 5) {
      // Save locally
      chrome.storage.local.get(['totalStudyTime'], (result) => {
        const total = (result.totalStudyTime || 0) + elapsed
        chrome.storage.local.set({ totalStudyTime: total })
      })
      
      // Sync to Cloud
      syncStudyTime(elapsed)
    }
  }
  activeTabStart = Date.now()
  activeUrl = url || ''
}
