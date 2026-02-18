const mongoose = require('mongoose');

async function findKrish() {
    try {
        const uri = `mongodb://localhost:27017/Anonskills`;
        const conn = await mongoose.createConnection(uri).asPromise();
        const user = await conn.db.collection('users').findOne({ username: 'krish' });
        console.log(`User: krish -> Email: ${user.email}`);
        await conn.close();
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
    process.exit();
}

findKrish();;;;
