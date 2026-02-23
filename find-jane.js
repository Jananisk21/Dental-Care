const { db } = require('./server/firebaseAdmin');

async function findJane() {
    try {
        console.log("Searching for 'Jane' or 'janesmith' in all users...");
        const snapshot = await db.collection('users').get();
        snapshot.forEach(doc => {
            const data = doc.data();
            const str = JSON.stringify(data).toLowerCase();
            if (str.includes('jane') || str.includes('smith')) {
                console.log(`\nDoc ID: ${doc.id}`);
                console.log("Data:", JSON.stringify(data, null, 2));
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findJane();
