/**
 * Background Service Worker for Study Dashboard Extension
 * Handles: Badge updates, Deadline notifications, Auth state sync
 */

// Import Firebase SDK and dependencies for background service worker
try {
  importScripts(
    'lib/firebase/firebase-app-compat.js',
    'lib/firebase/firebase-auth-compat.js',
    'lib/firebase/firebase-firestore-compat.js',
    'firebase-config.js',
    'sync-service.js'
  );
  console.log('[BACKGROUND] Firebase and sync-service loaded successfully');
} catch (error) {
  console.error('[BACKGROUND] Failed to load Firebase:', error);
}

// Initialize sync service when background script starts
if (typeof syncService !== 'undefined') {
  syncService.init().then((isLoggedIn) => {
    console.log('[BACKGROUND] Sync service initialized on startup, logged in:', isLoggedIn);
  }).catch(err => {
    console.error('[BACKGROUND] Failed to initialize sync service on startup:', err);
  });
}

// ==========================================
// EXTENSION LIFECYCLE
// ==========================================

chrome.runtime.onInstalled.addListener(() => {
  startPeriodicTasks();
});

chrome.runtime.onStartup.addListener(() => {
  startPeriodicTasks();
});

function startPeriodicTasks() {
  // Check deadlines every 30 seconds
  setInterval(checkDeadlines, 30000);
  // Check immediately on startup with small delay
  setTimeout(() => {
    checkDeadlines();
  }, 1000);
}

// ==========================================
// BADGE UPDATE
// ==========================================

async function updateBadge() {
  // Check if user is logged in before accessing cloud data
  if (typeof syncService === 'undefined' || !syncService.isLoggedIn()) {
    // User not logged in, clear badge
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  try {
    const tasks = await syncService.getTasks();
    const pendingCount = tasks.filter((task) => !task.completed).length;

    // Count tasks approaching deadline (within 3 days)
    const now = new Date();
    const approachingDeadlineCount = tasks.filter((task) => {
      if (task.completed || !task.deadline) return false;

      let deadline = new Date(task.deadline);
      if (
        task.deadline &&
        typeof task.deadline === "string" &&
        task.deadline.match(/^\d{4}-\d{2}-\d{2}$/) &&
        !task.deadline.includes("T") &&
        !task.deadline.includes(" ")
      ) {
        deadline.setHours(23, 59, 59, 999);
      }

      if (isNaN(deadline.getTime())) return false;

      const timeDiff = deadline - now;
      if (timeDiff < 0) return false; // Deadline passed

      const daysUntilDeadline = timeDiff / (1000 * 60 * 60 * 24);
      const hoursUntilDeadline = timeDiff / (1000 * 60 * 60);

      // Count tasks within 3 days or 3 hours
      return (
        (daysUntilDeadline <= 3 && daysUntilDeadline > 0) ||
        (hoursUntilDeadline <= 3 && hoursUntilDeadline > 0)
      );
    }).length;

    // Show approaching deadline count if any, otherwise show pending count
    const badgeCount =
      approachingDeadlineCount > 0 ? approachingDeadlineCount : pendingCount;
    chrome.action.setBadgeText({
      text: badgeCount > 0 ? badgeCount.toString() : "",
    });
    chrome.action.setBadgeBackgroundColor({
      color: approachingDeadlineCount > 0 ? "#e53e3e" : "#2563eb",
    });
  } catch (error) {
    console.error('Error updating badge:', error);
    // On error, clear badge
    chrome.action.setBadgeText({ text: "" });
  }
}

// ==========================================
// DEADLINE NOTIFICATIONS
// ==========================================

async function checkDeadlines() {
  // Check if user is logged in before accessing cloud data
  if (typeof syncService === 'undefined' || !syncService.isLoggedIn()) {
    return; // Skip deadline checks if not logged in
  }

  try {
    const tasks = await syncService.getTasks();
    
    chrome.storage.local.get(["sentNotifications"], (result) => {
      const sentNotifications = result.sentNotifications || {};
      const now = new Date();
      const notificationsToSend = [];

      tasks.forEach((task) => {
        // Skip completed tasks or tasks without deadline
        if (task.completed || !task.deadline) return;

        // Parse deadline
        let deadline = new Date(task.deadline);
        if (
          task.deadline &&
          typeof task.deadline === "string" &&
          task.deadline.match(/^\d{4}-\d{2}-\d{2}$/) &&
          !task.deadline.includes("T") &&
          !task.deadline.includes(" ")
        ) {
          deadline.setHours(23, 59, 59, 999);
        }

        if (isNaN(deadline.getTime())) return;

        const timeDiff = deadline - now;
        if (timeDiff < 0) return; // Deadline passed

        const hoursUntilDeadline = timeDiff / (1000 * 60 * 60);
        const daysUntilDeadline = timeDiff / (1000 * 60 * 60 * 24);

        const taskId = task.id;
        const notificationKey3Days = `${taskId}_3days`;
        const notificationKey1Day = `${taskId}_1day`;
        const notificationKey3Hours = `${taskId}_3hours`;
        const notificationKey1Hour = `${taskId}_1hour`;

        // 3 days before deadline
        const isThreeDays =
          (hoursUntilDeadline >= 60 && hoursUntilDeadline <= 84) ||
          (daysUntilDeadline >= 2.5 && daysUntilDeadline <= 3.5);

        if (isThreeDays && !sentNotifications[notificationKey3Days]) {
          notificationsToSend.push({
            key: notificationKey3Days,
            title: "Deadline Reminder - 3 Days",
            message: `"${task.text}" is due in 3 days${task.className ? ` (${task.className})` : ""}`,
            priority: task.priority || "medium",
          });
        }

        // 1 day before deadline
        const isTomorrow =
          (hoursUntilDeadline >= 12 && hoursUntilDeadline <= 36) ||
          (daysUntilDeadline >= 0.5 && daysUntilDeadline <= 1.5);

        if (isTomorrow && !sentNotifications[notificationKey1Day]) {
          notificationsToSend.push({
            key: notificationKey1Day,
            title: "Deadline Reminder - 1 Day",
            message: `"${task.text}" is due tomorrow${task.className ? ` (${task.className})` : ""}`,
            priority: task.priority || "medium",
          });
        }

        // 3 hours before deadline
        if (
          hoursUntilDeadline >= 2.5 &&
          hoursUntilDeadline <= 3.5 &&
          !sentNotifications[notificationKey3Hours]
        ) {
          notificationsToSend.push({
            key: notificationKey3Hours,
            title: "Deadline Reminder - 3 Hours",
            message: `"${task.text}" is due in 3 hours${task.className ? ` (${task.className})` : ""}`,
            priority: task.priority || "high",
          });
        }

        // 1 hour before deadline
        if (
          hoursUntilDeadline >= 0.5 &&
          hoursUntilDeadline <= 1.5 &&
          !sentNotifications[notificationKey1Hour]
        ) {
          notificationsToSend.push({
            key: notificationKey1Hour,
            title: "Deadline Reminder - 1 Hour",
            message: `"${task.text}" is due in 1 hour${task.className ? ` (${task.className})` : ""}`,
            priority: task.priority || "high",
          });
        }
      });

      // Send notifications
      if (notificationsToSend.length > 0) {
        const totalNotifications = notificationsToSend.length;
        let savedCount = 0;

        notificationsToSend.forEach((notif, index) => {
          setTimeout(() => {
            chrome.notifications.create(
              {
                type: "basic",
                iconUrl: "assets/icons/study 128.png",
                title: notif.title,
                message: notif.message,
                priority: notif.priority === "high" ? 2 : 1,
              },
              (notificationId) => {
                if (!chrome.runtime.lastError) {
                  sentNotifications[notif.key] = {
                    sentAt: now.toISOString(),
                    notificationId: notificationId,
                  };
                  savedCount++;
                  if (savedCount === totalNotifications) {
                    chrome.storage.local.set({ sentNotifications });
                  }
                }
              }
            );
          }, index * 300);
        });
      }

      // Clean up old notifications (older than 7 days) and for completed tasks
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const completedTaskIds = tasks.filter((t) => t.completed).map((t) => t.id);

      Object.keys(sentNotifications).forEach((key) => {
        const notification = sentNotifications[key];
        if (notification.sentAt && new Date(notification.sentAt) < sevenDaysAgo) {
          delete sentNotifications[key];
          return;
        }
        const taskId = key.split("_")[0];
        if (completedTaskIds.includes(taskId)) {
          delete sentNotifications[key];
        }
      });

      if (
        Object.keys(sentNotifications).length !==
        Object.keys(result.sentNotifications || {}).length
      ) {
        chrome.storage.local.set({ sentNotifications });
      }
    });
  } catch (error) {
    console.error('Error checking deadlines:', error);
  }
}

// ==========================================
// MESSAGE HANDLERS
// ==========================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showNotification") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icons/study 128.png",
      title: request.title,
      message: request.message,
    });
  }

  if (request.action === "openPopup") {
    sendResponse({ success: true });
  }

  if (request.action === "checkDeadlines") {
    checkDeadlines();
    sendResponse({ success: true });
  }

  if (request.action === "updateBadge") {
    updateBadge();
    sendResponse({ success: true });
  }

  if (request.action === "testNotification") {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "assets/icons/study 128.png",
        title: "Test Notification",
        message: "If you see this, notifications are working!",
      },
      (notificationId) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true, notificationId });
        }
      }
    );
    return true;
  }

  if (request.action === "resetNotifications") {
    chrome.storage.local.set({ sentNotifications: {} }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // Handle auth state change - broadcast to all extension views
  if (request.action === "authStateChanged") {
    console.log('[BACKGROUND] Auth state changed:', request.isLoggedIn, request.userEmail);
    
    chrome.storage.local.set({
      authState: {
        isLoggedIn: request.isLoggedIn,
        userEmail: request.userEmail || null,
        timestamp: Date.now(),
      },
    });

    // Broadcast to other views
    chrome.runtime
      .sendMessage({
        action: "authStateUpdate",
        isLoggedIn: request.isLoggedIn,
        userEmail: request.userEmail,
      })
      .catch(() => {});

    // If user just logged in, update badge and check deadlines
    if (request.isLoggedIn) {
      console.log('[BACKGROUND] User logged in, initializing sync service...');
      
      // Re-initialize syncService to detect the logged-in user
      if (typeof syncService !== 'undefined') {
        syncService.init().then((isLoggedIn) => {
          if (isLoggedIn) {
            console.log('[BACKGROUND] Sync service initialized, updating badge and checking deadlines');
            updateBadge();
            checkDeadlines();
          }
        }).catch(err => {
          console.error('[BACKGROUND] Failed to initialize sync service:', err);
        });
      }
    } else {
      // User logged out, clear badge
      console.log('[BACKGROUND] User logged out, clearing badge');
      chrome.action.setBadgeText({ text: "" });
    }

    sendResponse({ success: true });
    return true;
  }

  return true;
});
