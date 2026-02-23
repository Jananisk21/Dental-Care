const { db } = require('./server/firebaseAdmin');

async function checkDoctors() {
    try {
        console.log("--- START COMPREHENSIVE DOCTOR DATA CHECK ---");
        const snapshot = await db.collection('users').where('role', '==', 'doctor').get();

        if (snapshot.empty) {
            console.log("No users found with role 'doctor'.");
        } else {
            console.log(`Found ${snapshot.size} doctors.\n`);
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`ID: ${doc.id}`);
                console.log(`Email: ${data.email || 'N/A'}`);
                // Check for various possible name fields
                const fields = ['name', 'Name', 'fullName', 'fullname', 'displayName', 'display_name'];
                fields.forEach(f => {
                    if (data[f] !== undefined) {
                        console.log(`- FOUND FIELD [${f}]: "${data[f]}"`);
                    }
                });
                console.log("Full Data Keys:", Object.keys(data).join(', '));
                console.log("--------------------------------");
            });
        }
    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        console.log("--- END DOCTOR DATA CHECK ---");
        process.exit();
    }
}

checkDoctors();
