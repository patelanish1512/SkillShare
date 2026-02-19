const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all chats for the current user
router.get('/', auth, async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user.id
        })
            .populate('participants', 'username isOnline rating')
            .sort({ updatedAt: -1 });

        res.json(chats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get chat metadata (participants)
router.get('/:chatId/info', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', 'username isOnline rating');
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json(chat);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages for a specific chat
router.get('/:chatId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            chatId: req.params.chatId
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});




// Delete a message
router.delete('/messages/:messageId', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Only sender can delete their own message
        if (message.sender !== req.user.username) {
            // Need to verify by username since Message model stores sender name
            const user = await User.findById(req.user.id);
            if (!user || message.sender !== user.username) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        }

        await Message.findByIdAndDelete(req.params.messageId);
        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bulk delete messages
router.post('/messages/bulk-delete', auth, async (req, res) => {
    try {
        const { messageIds } = req.body;
        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({ message: 'Invalid message IDs' });
        }

        // Fetch user once for verification
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find messages and verify ownership
        const messages = await Message.find({ _id: { $in: messageIds } });
        const ownedMessageIds = messages
            .filter(msg => msg.sender === user.username)
            .map(msg => msg._id);

        if (ownedMessageIds.length === 0) {
            return res.status(403).json({ message: 'Unauthorized or no valid messages to delete' });
        }

        await Message.deleteMany({ _id: { $in: ownedMessageIds } });
        res.json({ 
            message: 'Messages deleted', 
            deletedCount: ownedMessageIds.length,
            deletedIds: ownedMessageIds 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
