/**
 * Firebase Configuration
 * Aozu Ops Hub
 */

const firebaseConfig = {
    apiKey: "AIzaSyBEnj3BBBDkT0pfdW6jLvJxJuC-b4FYNI0",
    authDomain: "aozu-ops-hub.firebaseapp.com",
    projectId: "aozu-ops-hub",
    storageBucket: "aozu-ops-hub.firebasestorage.app",
    messagingSenderId: "228102458914",
    appId: "1:228102458914:web:ed2548072c974b5e68c47b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence().catch((err) => {
    console.warn('Firestore persistence failed:', err);
});
