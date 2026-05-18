import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings optimized for restricted environments (like iframes)
if (!firebaseConfig.apiKey || firebaseConfig.projectId === 'YOUR_PROJECT_ID') {
    console.warn("Firebase configuration is missing or using placeholders. Please run 'set_up_firebase'.");
}

export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
    try {
        // Use getDocFromServer to bypass local cache and test the real connection
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection successful");
    } catch (error) {
        // If it's a permission error, it's actually "connected" but just blocked, which is better than "offline"
        const isPermissionError = 
            (error as any).code === 'permission-denied' || 
            (error instanceof Error && (
                error.message.toLowerCase().includes('permission-denied') || 
                error.message.toLowerCase().includes('insufficient permissions') ||
                error.message.toLowerCase().includes('missing or insufficient permissions')
            ));

        if (isPermissionError) {
            console.log("Firestore reachable (Permission Denied). This indicates a successful network connection.");
        } else if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('failed-precondition'))) {
            console.error("Please check your Firebase configuration or internet connection. Connectivity to Firestore failed.");
        } else {
            console.error("Firestore connection test error:", error);
        }
    }
}
testConnection();
