const mongoose = require('mongoose');;;;;;
const User = require('./server/models/User');
const Feedback = require('./server/models/Feedback');
require('dotenv').config({ path: './server/.env' });

async function checkReputation() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: 'krish' });
        if (!user) {
            console.log('User krish not found');
            await mongoose.disconnect();
            return;
        }

        console.log('--- User Core Stats ---');
        console.log('Username:', user.username);
        console.log('ID:', user._id);
        console.log('Rating (Stored):', user.rating);
        console.log('Total Ratings (Stored):', user.totalRatings);
        console.log('Sessions Completed (Stored):', user.sessionsCompleted);

        console.log('\n--- Feedbacks Received ---');
        const feedbacks = await Feedback.find({ toUser: user._id });
        console.log('Count:', feedbacks.length);

        let sum = 0;
        feedbacks.forEach((f, i) => {
            console.log(`[${i + 1}] Rating: ${f.rating}, Session: ${f.sessionId}, Date: ${f.createdAt}`);
            sum += f.rating;
        });

        if (feedbacks.length > 0) {
            console.log('\nCalculated Average:', sum / feedbacks.length);
        } else {
            console.log('\nNo feedbacks found for this user.');
        }

        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (err) {
        console.error('Error during diagnostics:', err);
        process.exit(1);
    }
}

checkReputation();
