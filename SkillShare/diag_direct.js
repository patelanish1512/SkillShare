const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: './server/.env' });

async function run() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/Anonskills';
    console.log('Connecting to:', uri);
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const db = client.db(); // Uses database from URI
        console.log('Using database:', db.databaseName);

        const users = db.collection('users');
        const feedbacks = db.collection('feedbacks');

        const user = await users.findOne({ username: 'krish' });
        if (!user) {
            console.log('User krish not found');
            return;
        }

        console.log('\n--- User Stats ---');
        console.log('ID:', user._id);
        console.log('Rating:', user.rating);
        console.log('Total Ratings:', user.totalRatings);
        console.log('Sessions Completed:', user.sessionsCompleted);

        console.log('\n--- Feedbacks Received by Krish ---');
        const userFeedbacks = await feedbacks.find({ toUser: user._id }).toArray();
        console.log('Count:', userFeedbacks.length);
        userFeedbacks.forEach((f, i) => {
            console.log(`[${i + 1}] Rating: ${f.rating}, Session: ${f.sessionId}, From: ${f.fromUser}`);
        });

        const total = userFeedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        console.log('\nCalculated Average:', userFeedbacks.length > 0 ? total / userFeedbacks.length : 0);

        console.log('\n--- Feedbacks Given by Krish ---');
        const givenFeedbacks = await feedbacks.find({ fromUser: user._id }).toArray();
        console.log('Count:', givenFeedbacks.length);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

run();
