require('dotenv').config();
const { admin, db } = require('./server/firebaseAdmin');

async function clearAllOldData() {
    console.log("Starting data cleanup...");
    let deletedUsersCount = 0;
    let deletedAppointmentsCount = 0;

    try {
        // 1. Delete all non-admin users
        const usersSnapshot = await db.collection('users').get();
        const batchUsers = db.batch();

        usersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.role !== 'admin') {
                batchUsers.delete(doc.ref);
                deletedUsersCount++;
                console.log(`Deleting user: ${doc.id} (Role: ${data.role}, Name: ${data.name})`);
            }
        });

        if (deletedUsersCount > 0) {
            await batchUsers.commit();
            console.log(`Successfully deleted ${deletedUsersCount} non-admin users.`);
        } else {
            console.log("No non-admin users found.");
        }

        // 2. Delete all appointments
        const appointmentsSnapshot = await db.collection('appointments').get();
        const batchAppointments = db.batch();

        appointmentsSnapshot.forEach((doc) => {
            batchAppointments.delete(doc.ref);
            deletedAppointmentsCount++;
            console.log(`Deleting appointment: ${doc.id}`);
        });

        if (deletedAppointmentsCount > 0) {
            await batchAppointments.commit();
            console.log(`Successfully deleted ${deletedAppointmentsCount} appointments.`);
        } else {
            console.log("No appointments found.");
        }

    } catch (error) {
        console.error("Error during cleanup:", error);
    } finally {
        console.log("Cleanup finished.");
        process.exit(0);
    }
}

clearAllOldData();
