// Firebase Configuration
// REPLACE these values with your actual Firebase project configuration
// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCgMU5A8KmQZNNplp6R8t30cZmHOXpimpI",
    authDomain: "dentcare-47681.firebaseapp.com",
    projectId: "dentcare-47681",
    storageBucket: "dentcare-47681.firebasestorage.app",
    messagingSenderId: "926745733232",
    appId: "1:926745733232:web:9e4879ed190ce441392cb5",
    measurementId: "G-Y02EVEWCLG"
};

// Initialize Firebase
let auth, db, analytics;

if (typeof firebase !== 'undefined') {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Initialize Services
    auth = firebase.auth();
    db = firebase.firestore();

    // Analytics is optional for core functionality
    if (firebase.analytics) {
        analytics = firebase.analytics();
    }

    // Expose to window for other scripts (auth.js, db.js)
    window.auth = auth;
    window.db = db;

    console.log("Firebase Initialized Successfully");
} else {
    console.warn("Firebase SDK not loaded. Using mock data for local testing.");
}

// Export for usage in other modules if using modules, or just global if using simple script tags
// For this vanilla JS setup, we'll assign to window for global access
window.dentCareStartFirebase = function () {
    return { auth, db };
};
