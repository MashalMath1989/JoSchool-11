import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to improve reliability in restricted environments like iframes
// We omit persistence to ensure compatibility across different browser settings
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
    try {
        // Use getDocFromServer to bypass local cache and test the real connection
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection successful");
    } catch (error) {
        console.error("Firestore connection test error:", error);
        // If it's a permission error, it's actually "connected" but just blocked, which is better than "offline"
        if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('failed-precondition'))) {
            console.error("Please check your Firebase configuration or internet connection. Connectivity to Firestore failed.");
        } else if (error instanceof Error && error.message.includes('permission-denied')) {
            console.log("Firestore reachable but permission denied for test document. This is acceptable for a connectivity test.");
        }
    }
}
testConnection();
