const { db } = require('./server/firebaseAdmin');

async function checkAppointments() {
    try {
        console.log("Checking last 10 appointments...");
        const snapshot = await db.collection('appointments').orderBy('createdAt', 'desc').limit(10).get();
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\nID: ${doc.id}`);
            console.log(`Patient: ${data.userName}`);
            console.log(`Doctor Field: "${data.doctor}"`);
            console.log(`Booking Type: ${data.bookingType}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkAppointments();
