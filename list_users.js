require('dotenv').config();
const { admin, db } = require('./server/firebaseAdmin');

async function listUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();
        console.log("Users in Firestore:");
        usersSnapshot.forEach((doc) => {
            console.log(doc.id, "=>", doc.data());
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
listUsers();
