const admin = require('firebase-admin');

// Check if using environment variables or file
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // If you want to use env var (e.g. in production)
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
} else {
    // For local dev, ensure serviceAccountKey.json exists or handle error
    try {
        const serviceAccount = require('../serviceAccountKey.json'); // You need to download this from Firebase Console
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin Initialized");
    } catch (error) {
        console.error("Firebase Admin Initialization Error: Make sure serviceAccountKey.json exists in the root.", error);
    }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
