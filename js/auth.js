/**
 * Authentication Logic for DentalCare+
 * Handles User Login, Registration, and Logout
 */

const Auth = {
    // Current User State
    currentUser: null,

    // Initialize Auth Listener
    init: function () {
        if (window.auth) {
            window.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // User is signed in, fetch profile
                    console.log("User signed in:", user.uid);
                    await this.fetchUserProfile(user.uid);
                } else {
                    // User is signed out
                    console.log("User signed out");
                    this.currentUser = null;
                    localStorage.removeItem('dentCareUser');
                    this.updateUI();
                }
            });
        }
    },

    // Fetch User Profile from Firestore
    fetchUserProfile: async function (uid) {
        try {
            if (window.db) {
                const doc = await window.db.collection('users').doc(uid).get();
                if (doc.exists) {
                    const userData = doc.data();
                    this.currentUser = {
                        uid: uid,
                        email: userData.email,
                        role: userData.role,
                        name: userData.name
                    };
                    // Cache for synchronous access
                    localStorage.setItem('dentCareUser', JSON.stringify(this.currentUser));
                    this.updateUI();
                } else {
                    console.warn("No user profile found in Firestore for UID:", uid);
                }
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    },

    // Login Function
    login: async function (email, password) {
        console.log(`Attempting login for ${email}`);

        if (window.auth) {
            try {
                const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
                // Explicitly fetch profile to ensure localStorage is ready before redirect
                await this.fetchUserProfile(userCredential.user.uid);
                return { success: true };
            } catch (error) {
                console.error("Firebase Login Error", error);
                return { success: false, message: error.message };
            }
        } else {
            return { success: false, message: "Firebase not initialized." };
        }
    },

    // Register Function
    register: async function (name, email, password, role) {
        if (window.auth && window.db) {
            try {
                // 1. Create Auth User
                const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 2. Create Firestore Profile
                await window.db.collection('users').doc(user.uid).set({
                    name: name,
                    email: email,
                    role: role,
                    createdAt: new Date()
                });

                // 3. Update Profile
                this.currentUser = { uid: user.uid, email, role, name };
                localStorage.setItem('dentCareUser', JSON.stringify(this.currentUser));

                return { success: true };
            } catch (error) {
                console.error("Registration Error", error);
                return { success: false, message: error.message };
            }
        }
        return { success: false, message: "Firebase not initialized." };
    },

    // Logout Function
    logout: async function () {
        if (window.auth) {
            await window.auth.signOut();
        }
        localStorage.removeItem('dentCareUser');
        window.location.href = 'index.html';
    },

    // Check if user is logged in (Synchronous check via localStorage for UI speed)
    checkSession: function () {
        const stored = localStorage.getItem('dentCareUser');
        if (stored) {
            this.currentUser = JSON.parse(stored);
            return this.currentUser;
        }
        return null;
    },

    // Update UI based on auth state
    updateUI: function () {
        // This function is called by main.js usually, but we can trigger a custom event
        const event = new CustomEvent('authChanged', { detail: this.currentUser });
        window.dispatchEvent(event);
    }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Expose Auth globally
window.Auth = Auth;
