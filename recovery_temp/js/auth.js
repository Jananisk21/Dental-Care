/**
 * Authentication Logic for DentalCare+
 * Handles User Login, Registration, and Logout
 */

const Auth = {
    // Initialize users from localStorage or defaults
    getUsers: function () {
        const storedUsers = localStorage.getItem('dentCareUsers');
        if (storedUsers) {
            return JSON.parse(storedUsers);
        }
        const defaults = [
            { email: 'patient@demo.com', password: 'password', role: 'patient', name: 'John Doe' },
            { email: 'doctor@demo.com', password: 'password', role: 'doctor', name: 'Dr. Smith' },
            { email: 'admin@demo.com', password: 'password', role: 'admin', name: 'Admin User' }
        ];
        localStorage.setItem('dentCareUsers', JSON.stringify(defaults));
        return defaults;
    },

    saveUser: function (user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem('dentCareUsers', JSON.stringify(users));
    },

    // Login Function
    login: async function (email, password, role) {
        console.log(`Attempting login for ${email} with role ${role}`);

        // 1. Try Firebase Login first
        if (window.auth) {
            try {
                const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                this.handleLoginSuccess(user, role);
                return { success: true };
            } catch (error) {
                console.error("Firebase Login Error", error);
            }
        }

        // 2. Mock Login with Persistence
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            if (user.role === role) {
                this.handleLoginSuccess(user, role);
                return { success: true };
            } else {
                return { success: false, message: "Invalid role for this user." };
            }
        } else {
            return { success: false, message: "Invalid email or password." };
        }
    },

    // Handle successful login
    handleLoginSuccess: function (user, role) {
        // Save session
        const sessionData = {
            uid: user.uid || 'mock-uid-' + Date.now(),
            email: user.email,
            role: role,
            name: user.name || user.email.split('@')[0],
            isLoggedIn: true
        };
        localStorage.setItem('dentCareUser', JSON.stringify(sessionData));

        // Redirect based on role
        this.redirectUser(role);
    },

    // Redirect user to their dashboard
    redirectUser: function (role) {
        switch (role) {
            case 'patient':
                window.location.href = 'dashboard-patient.html';
                break;
            case 'doctor':
                window.location.href = 'dashboard-doctor.html';
                break;
            case 'admin':
                window.location.href = 'dashboard-admin.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    },

    // Logout Function
    logout: function () {
        if (window.auth) {
            window.auth.signOut();
        }
        localStorage.removeItem('dentCareUser');
        window.location.href = 'index.html';
    },

    // Check if user is logged in
    checkSession: function () {
        const user = JSON.parse(localStorage.getItem('dentCareUser'));
        if (user && user.isLoggedIn) {
            return user;
        }
        return null; // Return null if not logged in
    },

    // Register Function (Mock for now)
    register: async function (name, email, password, role) {
        if (window.auth) {
            try {
                const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                return { success: true };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }

        // Mock Validation
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, message: "Email already registered." };
        }

        // Mock register
        const newUser = { email, password, role, name };
        this.saveUser(newUser);
        console.log("User registered:", newUser);
        return { success: true };
    }
};

// Expose Auth globally
window.Auth = Auth;
