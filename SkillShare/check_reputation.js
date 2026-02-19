const mongoose = require('mongoose');
const User = require('./server/models/User');
const Feedback = require('./server/models/Feedback');
require('dotenv').config({ path: './server/.env' });

async function checkReputation() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: 'krish' });
        if (!user) {
            console.log('User krish not found');
            return;
        }

        console.log('User Stats:', {
            username: user.username,
            rating: user.rating,
            totalRatings: user.totalRatings,
            sessionsCompleted: user.sessionsCompleted
        });

        const feedbacks = await Feedback.find({ toUser: user._id });
        console.log('Feedbacks received by krish:', feedbacks.length);
        feedbacks.forEach((f, i) => {
            console.log(`Feedback ${i + 1}: Rating ${f.rating}, Session ${f.sessionId}`);
        });

        const totalRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        const calculatedAvg = feedbacks.length > 0 ? totalRating / feedbacks.length : 0;
        console.log('Calculated Average:', calculatedAvg);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkReputation();
