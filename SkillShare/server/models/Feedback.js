const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ''
    },
    sessionId: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
