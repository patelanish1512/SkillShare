const Feedback = require('../models/Feedback');
const User = require('../models/User');

exports.addFeedback = async (req, res) => {
    try {
        const { toUserId, rating, comment, sessionId } = req.body;
        console.log(`[FEEDBACK] Submission received from ${req.user.id} for ${toUserId}. Rating: ${rating}`);
        const fromUserId = req.user.id;

        const feedback = new Feedback({
            fromUser: fromUserId,
            toUser: toUserId,
            rating,
            comment,
            sessionId
        });

        await feedback.save();

        // Update User's average rating
        const feedbacks = await Feedback.find({ toUser: toUserId });
        const totalRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
        const avgRating = totalRating / feedbacks.length;

        await User.findByIdAndUpdate(toUserId, {
            rating: avgRating,
            totalRatings: feedbacks.length
        });

        res.status(201).json({ message: 'Feedback added' });
    } catch (err) {
        console.error("[FEEDBACK_ERROR]", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
