/**
 * Database Logic for DentalCare+
 * Handles reading/writing data to Firebase Firestore
 */

const DB = {
    // Create New Appointment
    createAppointment: async function (appointmentData) {
        console.log("Creating Appointment:", appointmentData);
        if (window.db) {
            try {
                // Add timestamp
                const data = {
                    ...appointmentData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const docRef = await window.db.collection('appointments').add(data);
                console.log("Appointment created with ID: ", docRef.id);
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error("Firestore Error:", error);
                return { success: false, message: error.message };
            }
        } else {
            return { success: false, message: "Database not initialized" };
        }
    },

    // Get Appointments for a User (Patient/Doctor/Admin)
    getAppointments: async function (role, identifier) {
        if (!window.db) return [];

        try {
            let query = window.db.collection('appointments');

            if (role === 'patient') {
                // Filter by patient email or UID (assuming identifier is email for now based on legacy, but UID is better)
                // Let's support both or stick to what is passed. 
                // In main.js we are passing 'patientEmail'.
                query = query.where('patientEmail', '==', identifier);
            } else if (role === 'doctor') {
                // Filter by doctor name (exact match)
                query = query.where('doctor', '==', identifier);
            }
            // Admin gets all (no filter)

            const snapshot = await query.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        } catch (error) {
            console.error("Error fetching appointments:", error);
            // Fallback for index/compound query errors
            if (error.code === 'failed-precondition') {
                console.warn("Index might be missing. Attempting without ordering.");
                try {
                    // Retry without ordering
                    let query = window.db.collection('appointments');
                    if (role === 'patient') {
                        query = query.where('patientEmail', '==', identifier);
                    } else if (role === 'doctor') {
                        query = query.where('doctor', '==', identifier);
                    }
                    const snapshot = await query.get();
                    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (retryError) {
                    console.error("Retry failed:", retryError);
                    return [];
                }
            }
            return [];
        }
    },

    // Update Status
    updateStatus: async function (id, newStatus) {
        if (window.db) {
            try {
                await window.db.collection('appointments').doc(id).update({
                    status: newStatus
                });
                return true;
            } catch (error) {
                console.error("Error updating status:", error);
                return false;
            }
        }
        return false;
    }
};

window.DB = DB;
