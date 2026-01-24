/**
 * Sync Service for Study Dashboard Extension
 * Handles authentication and data synchronization with Firebase
 */

const syncService = {
    // State
    _initialized: false,
    _user: null,
    _unsubscribeAuth: null,
    _unsubscribeSync: null,
    _isUploading: false, // Flag to prevent sync race conditions

    /**
     * Initialize the sync service
     * @returns {Promise<boolean>} True if user is logged in
     */
    async init() {
        if (this._initialized) {
            return !!this._user;
        }

        try {
            // Check if Firebase is configured
            if (!isFirebaseConfigured()) {
                console.warn('Firebase not configured. Sync features disabled.');
                this._initialized = true;
                return false;
            }

            // Initialize Firebase
            await initializeFirebase();
            const { auth, db } = getFirebaseInstances();
            
            // Note: Chrome Identity API doesn't use redirect flow
            // Google auth is now handled directly via chrome.identity.launchWebAuthFlow
            // in loginWithGoogle() method below

            // Set up auth state listener
            return new Promise((resolve) => {
                this._unsubscribeAuth = auth.onAuthStateChanged((user) => {
                    this._user = user;
                    this._initialized = true;
                    
                    if (user) {
                        console.log('User logged in:', user.email);
                        this._startRealtimeSync();
                    } else {
                        console.log('User logged out');
                        this._stopRealtimeSync();
                    }
                    
                    resolve(!!user);
                });
            });
        } catch (error) {
            console.error('Sync service initialization failed:', error);
            this._initialized = true;
            return false;
        }
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        return this._user;
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this._user;
    },

    /**
     * Register a new user
     * @param {string} email 
     * @param {string} password 
     */
    async register(email, password) {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase not configured. Please set up your Firebase project.');
        }

        await initializeFirebase();
        const { auth, db } = getFirebaseInstances();

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('[SYNC] Email registration successful for:', user.email);

            // Create user profile document
            try {
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastSync: null
                });
                console.log('[SYNC] ✅ User profile created successfully in Firestore');
            } catch (dbError) {
                console.error('[SYNC] ❌ Failed to create user profile in Firestore:', dbError);
                console.error('[SYNC] Error code:', dbError.code);
                console.error('[SYNC] Error message:', dbError.message);
                // Don't throw - authentication was successful even if profile creation failed
            }

            // Upload any existing local data
            await this.syncToCloud();

            return user;
        } catch (error) {
            console.error('Registration failed:', error);
            throw this._formatAuthError(error);
        }
    },

    /**
     * Login existing user
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase not configured. Please set up your Firebase project.');
        }

        await initializeFirebase();
        const { auth } = getFirebaseInstances();

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // Sync data from cloud after login
            await this.syncFromCloud();

            return userCredential.user;
        } catch (error) {
            console.error('Login failed:', error);
            throw this._formatAuthError(error);
        }
    },

    /**
     * Login with Google using Chrome Identity API
     * This is the proper way to do OAuth in Chrome Extensions
     */
    async loginWithGoogle() {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase not configured.');
        }

        // Check if OAuth is configured
        if (typeof isOAuthConfigured === 'undefined' || !isOAuthConfigured()) {
            throw new Error('OAuth Client ID not configured. Please update oauth-config.js with your Google Cloud OAuth Client ID.');
        }

        await initializeFirebase();
        const { auth, db } = getFirebaseInstances();

        try {
            console.log('[SYNC] Starting Chrome Identity OAuth flow...');
            
            // Step 1: Get OAuth access token via Chrome Identity API
            const accessToken = await this._getGoogleOAuthToken();
            console.log('[SYNC] ✅ OAuth token received');
            
            // Step 2: Create Firebase credential from OAuth token
            const credential = firebase.auth.GoogleAuthProvider.credential(null, accessToken);
            console.log('[SYNC] Converting token to Firebase credential...');
            
            // Step 3: Sign in to Firebase with the credential
            const result = await auth.signInWithCredential(credential);
            const user = result.user;
            console.log('[SYNC] ✅ Signed in to Firebase:', user.email);
            
            // Step 4: Create/update user profile in Firestore
            try {
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                console.log('[SYNC] ✅ User profile created/updated');
            } catch (dbError) {
                console.error('[SYNC] ❌ Failed to create user profile:', dbError);
                // Don't throw - auth was successful even if profile creation failed
            }
            
            return user;
            
        } catch (error) {
            console.error('[SYNC] ❌ Google login failed:', error);
            console.error('[SYNC] Error code:', error.code);
            console.error('[SYNC] Error message:', error.message);
            throw this._formatAuthError(error);
        }
    },

    /**
     * Get Google OAuth token using Chrome Identity API
     * @private
     * @returns {Promise<string>} OAuth access token
     */
    async _getGoogleOAuthToken() {
        return new Promise((resolve, reject) => {
            if (typeof chrome === 'undefined' || !chrome.identity) {
                reject(new Error('Chrome Identity API not available. This feature only works in Chrome extensions.'));
                return;
            }

            const config = getOAuthConfig();
            const redirectUrl = chrome.identity.getRedirectURL();
            
            // Build OAuth URL
            const authUrl = new URL(config.authUrl);
            authUrl.searchParams.set('client_id', config.clientId);
            authUrl.searchParams.set('response_type', 'token');
            authUrl.searchParams.set('redirect_uri', redirectUrl);
            authUrl.searchParams.set('scope', config.scopes.join(' '));
            
            console.log('[SYNC] Launching OAuth flow...');
            console.log('[SYNC] Redirect URL:', redirectUrl);
            
            // Launch OAuth flow in secure window
            chrome.identity.launchWebAuthFlow({
                url: authUrl.toString(),
                interactive: true
            }, (responseUrl) => {
                // Check for errors
                if (chrome.runtime.lastError) {
                    console.error('[SYNC] Chrome Identity error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                
                if (!responseUrl) {
                    reject(new Error('No response from OAuth flow. User may have cancelled.'));
                    return;
                }
                
                console.log('[SYNC] OAuth response received');
                
                // Extract access token from response URL
                // Response format: https://redirect_url#access_token=xxx&token_type=Bearer&expires_in=3600
                try {
                    const url = new URL(responseUrl);
                    const params = new URLSearchParams(url.hash.substring(1)); // Remove # and parse
                    const token = params.get('access_token');
                    
                    if (token) {
                        resolve(token);
                    } else {
                        reject(new Error('No access token in OAuth response'));
                    }
                } catch (parseError) {
                    console.error('[SYNC] Failed to parse OAuth response:', parseError);
                    reject(new Error('Failed to parse OAuth response: ' + parseError.message));
                }
            });
        });
    },

    /**
     * Logout current user
     */
    async logout() {
        if (!isFirebaseConfigured()) return;

        const { auth } = getFirebaseInstances();
        await auth.signOut();
        this._user = null;
    },

    /**
     * Send password reset email
     * @param {string} email 
     */
    async resetPassword(email) {
        if (!isFirebaseConfigured()) {
            throw new Error('Firebase not configured.');
        }

        const { auth } = getFirebaseInstances();

        try {
            await auth.sendPasswordResetEmail(email);
        } catch (error) {
            throw this._formatAuthError(error);
        }
    },

    // ==========================================
    // DIRECT CLOUD CRUD OPERATIONS - TASKS
    // ==========================================

    /**
     * Get all tasks from cloud (cloud-only, no local storage)
     * @returns {Promise<Array>} Array of tasks
     */
    async getTasks() {
        if (!this._user) {
            throw new Error('Must be logged in to access tasks');
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            const tasksSnapshot = await db.collection('users').doc(userId).collection('tasks').get();
            
            const tasks = [];
            tasksSnapshot.forEach(doc => {
                const data = doc.data();
                // Remove Firestore-specific fields
                delete data.updatedAt;
                tasks.push(data);
            });
            
            console.log(`Loaded ${tasks.length} tasks from cloud`);
            return tasks;
        } catch (error) {
            console.error('Failed to get tasks from cloud:', error);
            throw new Error('Failed to load tasks. Please check your connection.');
        }
    },

    /**
     * Add a new task directly to cloud
     * @param {Object} taskData - Task data to add
     * @returns {Promise<Object>} The created task with ID
     */
    async addTask(taskData) {
        if (!this._user) {
            throw new Error('Must be logged in to add tasks');
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            
            // Ensure task has required fields
            const taskId = taskData.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newTask = {
                ...taskData,
                id: taskId,
                updatedAt: Date.now()
            };
            
            await db.collection('users').doc(userId).collection('tasks').doc(taskId).set({
                ...newTask,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Task added to cloud:', taskId);
            return newTask;
        } catch (error) {
            console.error('Failed to add task:', error);
            throw new Error('Failed to add task. Please try again.');
        }
    },

    /**
     * Update an existing task in cloud
     * @param {string} taskId - ID of task to update
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateTask(taskId, updates) {
        if (!this._user) {
            throw new Error('Must be logged in to update tasks');
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            
            await db.collection('users').doc(userId).collection('tasks').doc(taskId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Task updated in cloud:', taskId);
        } catch (error) {
            console.error('Failed to update task:', error);
            throw new Error('Failed to update task. Please try again.');
        }
    },

    /**
     * Delete a task from cloud
     * @param {string} taskId - ID of task to delete
     * @returns {Promise<void>}
     */
    async deleteTask(taskId) {
        if (!this._user) {
            throw new Error('Must be logged in to delete tasks');
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            
            await db.collection('users').doc(userId).collection('tasks').doc(taskId).delete();
            
            console.log('Task deleted from cloud:', taskId);
        } catch (error) {
            console.error('Failed to delete task:', error);
            throw new Error('Failed to delete task. Please try again.');
        }
    },

    // ==========================================
    // DIRECT CLOUD CRUD OPERATIONS - CLASSES
    // ==========================================

    /**
     * Get all classes from cloud
     * @returns {Promise<Array>} Array of classes
     */
    async getClasses() {
        if (!this._user) {
            throw new Error('Must be logged in to access classes');
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            const classesSnapshot = await db.collection('users').doc(userId).collection('classes').get();
            
            const classes = [];
            classesSnapshot.forEach(doc => {
                const data = doc.data();
                delete data.updatedAt;
                classes.push(data);
            });
            
            console.log(`Loaded ${classes.length} classes from cloud`);
            return classes;
        } catch (error) {
            console.error('Failed to get classes from cloud:', error);
            throw new Error('Failed to load classes. Please check your connection.');
        }
    },

    /**
     * Add a new class directly to cloud
     * @param {Object} classData - Class data to add
     * @returns {Promise<Object>} The created class with ID
     */
    async addClass(classData) {
        if (!this._user) {
            throw new Error('Must be logged in to add classes');
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            
            const classId = classData.id || `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newClass = {
                ...classData,
                id: classId,
                updatedAt: Date.now()
            };
            
            await db.collection('users').doc(userId).collection('classes').doc(classId).set({
                ...newClass,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Class added to cloud:', classId);
            return newClass;
        } catch (error) {
            console.error('Failed to add class:', error);
            throw new Error('Failed to add class. Please try again.');
        }
    },

    /**
     * Update an existing class in cloud
     * @param {string} classId - ID of class to update
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateClass(classId, updates) {
        if (!this._user) {
            throw new Error('Must be logged in to update classes');
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            
            await db.collection('users').doc(userId).collection('classes').doc(classId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Class updated in cloud:', classId);
        } catch (error) {
            console.error('Failed to update class:', error);
            throw new Error('Failed to update class. Please try again.');
        }
    },

    /**
     * Delete a class from cloud
     * @param {string} classId - ID of class to delete
     * @returns {Promise<void>}
     */
    async deleteClass(classId) {
        if (!this._user) {
            throw new Error('Must be logged in to delete classes');
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            
            await db.collection('users').doc(userId).collection('classes').doc(classId).delete();
            
            console.log('Class deleted from cloud:', classId);
        } catch (error) {
            console.error('Failed to delete class:', error);
            throw new Error('Failed to delete class. Please try again.');
        }
    },

    /**
     * Sync local data to cloud
     */
    async syncToCloud() {
        if (!this._user) {
            console.log('Not logged in, skipping cloud sync');
            return false;
        }

        try {
            this._isUploading = true; // Set flag to prevent download race condition
            
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;

            // Get all local data
            const localData = await this._getLocalData();

            // Create batch write
            const batch = db.batch();
            const userRef = db.collection('users').doc(userId);

            // Sync classes
            if (localData.myClasses && localData.myClasses.length > 0) {
                for (const classItem of localData.myClasses) {
                    const classRef = userRef.collection('classes').doc(classItem.id);
                    batch.set(classRef, {
                        ...classItem,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            }

            // Sync tasks
            if (localData.tasks && localData.tasks.length > 0) {
                for (const task of localData.tasks) {
                    const taskId = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    task.id = taskId;
                    const taskRef = userRef.collection('tasks').doc(taskId);
                    batch.set(taskRef, {
                        ...task,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            }

            // Sync settings
            const settingsRef = userRef.collection('settings').doc('preferences');
            batch.set(settingsRef, {
                darkMode: localData.darkMode || false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Update last sync time
            batch.update(userRef, {
                lastSync: firebase.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();
            console.log('Data synced to cloud successfully');
            
            // Clear the flag after a short delay to allow Firestore to propagate
            setTimeout(() => {
                this._isUploading = false;
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Cloud sync failed:', error);
            this._isUploading = false; // Clear flag on error too
            throw error;
        }
    },

    /**
     * Sync data from cloud to local
     */
    async syncFromCloud() {
        if (!this._user) {
            console.log('Not logged in, skipping cloud sync');
            return false;
        }

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            const userRef = db.collection('users').doc(userId);

            // Get classes from cloud
            const classesSnapshot = await userRef.collection('classes').get();
            const cloudClasses = [];
            classesSnapshot.forEach(doc => {
                const data = doc.data();
                // Remove Firestore timestamp fields for local storage
                delete data.updatedAt;
                cloudClasses.push(data);
            });

            // Get tasks from cloud
            const tasksSnapshot = await userRef.collection('tasks').get();
            const cloudTasks = [];
            tasksSnapshot.forEach(doc => {
                const data = doc.data();
                delete data.updatedAt;
                cloudTasks.push(data);
            });

            // Get settings from cloud
            const settingsDoc = await userRef.collection('settings').doc('preferences').get();
            const cloudSettings = settingsDoc.exists ? settingsDoc.data() : {};

            // Get local data for merging
            const localData = await this._getLocalData();

            // Merge data (cloud takes priority but preserve local IDs)
            const mergedClasses = this._mergeArrays(localData.myClasses || [], cloudClasses, 'id');
            const mergedTasks = this._mergeArrays(localData.tasks || [], cloudTasks, 'id');

            // Save merged data locally
            await this._setLocalData({
                myClasses: mergedClasses,
                tasks: mergedTasks,
                darkMode: cloudSettings.darkMode ?? localData.darkMode ?? false
            });

            console.log('Data synced from cloud successfully');
            return true;
        } catch (error) {
            console.error('Cloud sync failed:', error);
            throw error;
        }
    },

    /**
     * Start real-time sync listener
     */
    _startRealtimeSync() {
        if (!this._user || this._unsubscribeSync) return;

        try {
            const { db } = getFirebaseInstances();
            const userId = this._user.uid;
            const userRef = db.collection('users').doc(userId);

            // Listen for class changes
            this._unsubscribeSync = userRef.collection('classes').onSnapshot(
                (snapshot) => {
                    // Skip if we're currently uploading to prevent race conditions
                    if (this._isUploading) {
                        console.log('Upload in progress, skipping download sync');
                        return;
                    }
                    
                    if (!snapshot.metadata.hasPendingWrites) {
                        console.log('Remote changes detected, syncing...');
                        this.syncFromCloud();
                    }
                },
                (error) => {
                    console.error('Realtime sync error:', error);
                }
            );
        } catch (error) {
            console.error('Failed to start realtime sync:', error);
        }
    },

    /**
     * Stop real-time sync listener
     */
    _stopRealtimeSync() {
        if (this._unsubscribeSync) {
            this._unsubscribeSync();
            this._unsubscribeSync = null;
        }
    },

    /**
     * Get local data from Chrome storage
     */
    _getLocalData() {
        return new Promise((resolve) => {
            chrome.storage.local.get(
                ['myClasses', 'tasks', 'darkMode', 'hasInitializedClasses', 'sentNotifications'],
                (result) => resolve(result)
            );
        });
    },

    /**
     * Set local data in Chrome storage
     */
    _setLocalData(data) {
        return new Promise((resolve) => {
            chrome.storage.local.set(data, resolve);
        });
    },

    /**
     * Merge two arrays by a key field (newer updatedAt timestamp takes priority)
     */
    _mergeArrays(localArr, cloudArr, keyField) {
        const merged = new Map();

        // Add all local items
        for (const item of localArr) {
            if (item[keyField]) {
                merged.set(item[keyField], { ...item, source: 'local' });
            }
        }

        // Merge cloud items, but only if they're newer or local doesn't exist
        for (const cloudItem of cloudArr) {
            if (cloudItem[keyField]) {
                const existingItem = merged.get(cloudItem[keyField]);
                
                if (!existingItem) {
                    // Item doesn't exist locally, use cloud version
                    merged.set(cloudItem[keyField], { ...cloudItem, source: 'cloud' });
                } else {
                    // Compare timestamps to determine which is newer
                    const cloudTime = cloudItem.updatedAt || 0;
                    const localTime = existingItem.updatedAt || 0;
                    
                    // Keep the newer version
                    if (cloudTime > localTime) {
                        merged.set(cloudItem[keyField], { ...cloudItem, source: 'cloud' });
                    }
                    // else: keep the existing local item (it's newer)
                }
            }
        }

        // Remove the 'source' field before returning
        return Array.from(merged.values()).map(item => {
            const { source, ...cleanItem } = item;
            return cleanItem;
        });
    },

    /**
     * Format Firebase auth errors to user-friendly messages
     */
    _formatAuthError(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/operation-not-allowed': 'Email/password sign-in is not enabled.',
            'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };

        const message = errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
        return new Error(message);
    },

    /**
     * Trigger sync after data changes (debounced)
     */
    _syncTimeout: null,
    triggerSync() {
        if (!this._user) return;

        // Debounce sync calls
        if (this._syncTimeout) {
            clearTimeout(this._syncTimeout);
        }

        this._syncTimeout = setTimeout(() => {
            this.syncToCloud().catch(err => {
                console.error('Background sync failed:', err);
            });
        }, 2000); // Wait 2 seconds after last change
    }
};

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    window.syncService = syncService;
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            syncService.init().catch(console.error);
        });
    } else {
        syncService.init().catch(console.error);
    }
}
