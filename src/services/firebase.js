/**
 * Firebase Configuration for Study Dashboard Extension
 * Using Firebase npm modules (replaces manual compat lib files)
 */
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, indexedDBLocalPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyChGVnI_0LDmhtIKhAvP0mEOYh9KaIxFGI",
  authDomain: "studydashboard-bd8f0.firebaseapp.com",
  projectId: "studydashboard-bd8f0",
  storageBucket: "studydashboard-bd8f0.firebasestorage.app",
  messagingSenderId: "912149378367",
  appId: "1:912149378367:web:bd63f64c5b559e996f4f8a",
  measurementId: "G-KK0S1DWCQ4"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
// Use IndexedDB persistence to share auth state between Popup and Service Worker
setPersistence(auth, indexedDBLocalPersistence).catch(console.error)

// Initialize Firestore with persistent offline cache (modern API)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})

export { app, auth, db }
export default app
