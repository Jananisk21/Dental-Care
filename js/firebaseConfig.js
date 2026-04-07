// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
// NOTE: For Phone OTP to work on Vercel, you MUST add your Vercel domain 
// (e.g., your-app.vercel.app) to "Authorized Domains" in the Firebase Console:
// Authentication > Settings > Authorized Domains
const firebaseConfig = {
    apiKey: "AIzaSyAbwPl04o9sveQrwSb4HBonCxRs6ML1E0E",
    authDomain: "dentcare-47681.firebaseapp.com",
    projectId: "dentcare-47681",
    storageBucket: "dentcare-47681.firebasestorage.app",
    messagingSenderId: "926745733232",
    appId: "1:926745733232:web:9e4879ed190ce441392cb5",
    measurementId: "G-Y02EVEWCLG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider, EmailAuthProvider };
