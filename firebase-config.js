/**
 * Firebase Configuration for Study Dashboard Extension
 * 
 * IMPORTANT: Replace the placeholder values below with your actual Firebase project credentials.
 * 
 * To get your Firebase configuration:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing one
 * 3. Go to Project Settings > General > Your apps
 * 4. Click "Add app" > Web app
 * 5. Copy the firebaseConfig object and paste below
 */

// Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyChGVnI_0LDmhtIKhAvP0mEOYh9KaIxFGI",
    authDomain: "studydashboard-bd8f0.firebaseapp.com",
    projectId: "studydashboard-bd8f0",
    storageBucket: "studydashboard-bd8f0.firebasestorage.app",
    messagingSenderId: "912149378367",
    appId: "1:912149378367:web:bd63f64c5b559e996f4f8a",
    measurementId: "G-KK0S1DWCQ4"
};

// Firebase SDKs are now loaded locally in the HTML files
// See: lib/firebase/

// Track loaded scripts
let firebaseLoaded = false;
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

/**
 * Initialize Firebase SDK
 * @returns {Promise<{app: object, auth: object, db: object}>}
 */
async function initializeFirebase() {
    if (firebaseLoaded && firebaseApp) {
        return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
    }

    try {
        // Check if global firebase object is available
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded. Ensure local Firebase scripts are included in HTML.');
        }

        // Check if config is valid
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            throw new Error('Firebase not configured. Please update firebase-config.js with your project credentials.');
        }

        // Initialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        firebaseDb = firebase.firestore();

        // Enable offline persistence
        try {
            await firebaseDb.enablePersistence({ synchronizeTabs: true });
        } catch (err) {
            if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence not available in this browser');
            }
        }

        firebaseLoaded = true;
        console.log('Firebase initialized successfully');

        return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        throw error;
    }
}

/**
 * Get Firebase instances (must call initializeFirebase first)
 */
function getFirebaseInstances() {
    if (!firebaseLoaded) {
        throw new Error('Firebase not initialized. Call initializeFirebase() first.');
    }
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
}

/**
 * Check if Firebase is configured (not using placeholder values)
 */
function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
           firebaseConfig.projectId !== "YOUR_PROJECT_ID";
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
    window.initializeFirebase = initializeFirebase;
    window.getFirebaseInstances = getFirebaseInstances;
    window.isFirebaseConfigured = isFirebaseConfigured;
}
