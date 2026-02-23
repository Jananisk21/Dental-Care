/**
 * Database Logic for DentalCare+
 * Handles reading/writing data to Firebase Firestore (or Mock Storage)
 */

const DB = {
    // Mock Data Store
    appointments: [
        { id: 101, patientName: "John Doe", doctor: "Dr. Smith", service: "Cleaning", date: "2026-03-10", time: "10:00", type: "Direct", status: "Confirmed" },
        { id: 102, patientName: "Alice Brown", doctor: "Dr. Jane", service: "Consultation", date: "2026-03-12", time: "14:00", type: "Online", status: "Pending" }
    ],

    // Create New Appointment
    createAppointment: async function (appointmentData) {
        console.log("Creating Appointment:", appointmentData);
        if (window.db) {
            try {
                await window.db.collection('appointments').add({
                    ...appointmentData,
                    createdAt: new Date()
                });
                return { success: true };
            } catch (error) {
                console.error("Firestore Error:", error);
            }
        }

        // Mock Save
        appointmentData.id = Math.floor(Math.random() * 10000);
        appointmentData.status = "Pending"; // Default status
        this.appointments.push(appointmentData);

        // Simulating Payment Requirement
        if (appointmentData.paymentRequired) {
            return { success: true, paymentRedirect: true, appointmentId: appointmentData.id };
        }

        return { success: true };
    },

    // Get Appointments for a User (Patient/Doctor)
    getAppointments: async function (role, userName) {
        if (window.db) {
            try {
                let query = window.db.collection('appointments');

                if (role === 'patient') {
                    query = query.where('patientName', '==', userName);
                } else if (role === 'doctor') {
                    // Match by doctor name (assuming exact match string for now)
                    // In a real app, we'd use UIDs
                    query = query.where('doctor', '==', userName);
                }
                // Admin gets all, so no filter needed for admin

                const snapshot = await query.get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error("Error fetching appointments from Firestore:", error);
                return [];
            }
        }

        // Mock Fallback
        if (role === 'patient') {
            return this.appointments.filter(app => app.patientName === userName);
        } else if (role === 'doctor') {
            return this.appointments;
        } else if (role === 'admin') {
            return this.appointments;
        }
        return [];
    },

    // Update Status
    updateStatus: async function (id, newStatus) {
        const app = this.appointments.find(a => a.id == id);
        if (app) {
            app.status = newStatus;
            return true;
        }
        return false;
    }
};

window.DB = DB;
