const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { v4: uuidv4 } = require('uuid');

let waitingUsers = []; // Array of { socketId, userId, skillsTeach, skillsLearn }

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_user', async (userId) => {
            try {
                await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id });
                io.emit('user_status_changed', { userId, isOnline: true });
            } catch (e) {
                console.error(e);
            }
        });

        socket.on('find_match', async ({ userId, targetUserId }) => {
            console.log(`User ${userId} looking for match. Targeting: ${targetUserId || 'anyone'}`);

            try {
                const user = await User.findById(userId);
                if (!user) return;

                // Check if user is already in queue
                const existingIndex = waitingUsers.findIndex(u => u.userId === userId);
                if (existingIndex !== -1) {
                    waitingUsers.splice(existingIndex, 1);
                }

                const currentUser = {
                    socketId: socket.id,
                    userId: user._id.toString(),
                    skillsTeach: user.skillsTeach,
                    skillsLearn: user.skillsLearn,
                    username: user.username,
                    rating: user.rating || 0,
                    targeting: targetUserId // Track if this user is looking for someone specific
                };

                // Normalize skills for comparison
                const normalize = (skills) => skills.map(s => s.toLowerCase().trim());
                const myLearn = normalize(currentUser.skillsLearn);
                const myTeach = normalize(currentUser.skillsTeach);

                // Match prioritization:
                // 1. Check if ANYONE in waitingUsers is targeting current user
                // 2. Check if current user is targeting someone specifically
                // 3. Fallback to skill match
                const matchIndex = waitingUsers.findIndex(waitingUser => {
                    // Scenario A: I am targeting them, or they are targeting me
                    if ((currentUser.targeting && waitingUser.userId === currentUser.targeting) ||
                        (waitingUser.targeting && waitingUser.targeting === currentUser.userId)) {
                        console.log(`[MATCH] Priority Targeted Match: ${currentUser.username} <--> ${waitingUser.username}`);
                        return true;
                    }

                    // If either user is targeting SOMEONE ELSE (not the current partner), skip them for regular matching
                    if (currentUser.targeting || waitingUser.targeting) return false;

                    // Scenario B: Skill matching
                    const userTeach = normalize(waitingUser.skillsTeach);
                    const userLearn = normalize(waitingUser.skillsLearn);

                    const teachMatch = myLearn.some(skill => userTeach.includes(skill));
                    const learnMatch = myTeach.some(skill => userLearn.includes(skill));

                    if (teachMatch || learnMatch) {
                        console.log(`Match found based on skills: ${teachMatch ? 'Teach' : ''} ${learnMatch ? 'Learn' : ''}`);
                        return true;
                    }
                    return false;
                });

                if (matchIndex !== -1) {
                    const matchedUser = waitingUsers[matchIndex];
                    waitingUsers.splice(matchIndex, 1); // Remove matched user from queue

                    // Check for existing chat or create new one
                    let chat = await Chat.findOne({
                        participants: { $all: [currentUser.userId, matchedUser.userId] }
                    });

                    if (!chat) {
                        chat = new Chat({
                            participants: [currentUser.userId, matchedUser.userId]
                        });
                        await chat.save();
                    }

                    const roomId = chat._id.toString();

                    // Notify both users
                    console.log(`[MATCH] Emitting to Current User (${currentUser.username}, ${currentUser.socketId})`);
                    io.to(currentUser.socketId).emit('match_found', {
                        roomId,
                        partner: {
                            username: matchedUser.username,
                            id: matchedUser.userId,
                            rating: matchedUser.rating,
                            isOnline: true
                        }
                    });

                    console.log(`[MATCH] Emitting to Matched User (${matchedUser.username}, ${matchedUser.socketId})`);
                    io.to(matchedUser.socketId).emit('match_found', {
                        roomId,
                        partner: {
                            username: currentUser.username,
                            id: currentUser.userId,
                            rating: currentUser.rating,
                            isOnline: true
                        }
                    });

                    console.log(`[MATCH] Success: ${currentUser.username} <--> ${matchedUser.username}`);
                } else {
                    waitingUsers.push(currentUser);
                    socket.emit('waiting_for_match');
                    console.log(`[MATCH] No match found. Added ${currentUser.username} to queue. Queue size: ${waitingUsers.length}`);

                    // Broadcast invite to potential matches who are online but not searching
                    try {
                        const potentialMatches = await User.find({
                            _id: { $ne: currentUser.userId },
                            isOnline: true,
                            socketId: { $ne: null }
                        });

                        potentialMatches.forEach(user => {
                            // Skip if user is already in waiting queue (they would have matched already if compatible)
                            if (waitingUsers.some(u => u.userId === user._id.toString())) return;

                            const userTeach = normalize(user.skillsTeach);
                            const userLearn = normalize(user.skillsLearn);

                            const teachMatch = myLearn.some(skill => userTeach.includes(skill));
                            const learnMatch = myTeach.some(skill => userLearn.includes(skill));

                            if (teachMatch || learnMatch) {
                                console.log(`[MATCH] Sending invite to ${user.username}`);
                                io.to(user.socketId).emit('match_invite', {
                                    startUser: {
                                        username: currentUser.username,
                                        skillsTeach: currentUser.skillsTeach,
                                        skillsLearn: currentUser.skillsLearn,
                                        rating: user.rating || 0 // Pass rating here. Note: currentUser object needs rating!
                                    }
                                });
                            }
                        });
                    } catch (e) {
                        console.error("Error broadcasting invites:", e);
                    }
                }

            } catch (err) {
                console.error(err);
            }
        });

        socket.on('join_room', ({ roomId }) => {
            socket.roomId = roomId; // Track current room
            socket.join(roomId);
        });

        socket.on('leave_room', async ({ roomId }, callback) => {
            try {
                // Find participants to increment session count
                const chat = await Chat.findById(roomId);
                if (chat && !chat.isCompleted) {
                    await User.updateMany(
                        { _id: { $in: chat.participants } },
                        { $inc: { sessionsCompleted: 1 } }
                    );
                    chat.isCompleted = true; // Mark chat as counted
                    await chat.save();
                    console.log(`[CHAT] Sessions incremented for both participants in room ${roomId}`);
                }
            } catch (err) {
                console.error("[CHAT] Error incrementing sessions:", err);
            }

            socket.to(roomId).emit('session_ended', { roomId });
            socket.leave(roomId);
            socket.roomId = null;
            if (callback) callback();
        });

        socket.on('send_message', async ({ roomId, content, sender }) => {
            try {
                if (!content || !content.trim()) {
                    console.log(`[CHAT] Ignoring empty message from ${sender}`);
                    return;
                }

                // Save message to DB
                console.log(`[CHAT] Saving message to ${roomId}: ${content}`);
                const newMessage = new Message({
                    chatId: roomId,
                    sender,
                    content: content
                });
                await newMessage.save();

                await Chat.findByIdAndUpdate(roomId, {
                    lastMessage: content,
                    updatedAt: Date.now()
                });

                io.to(roomId).emit('receive_message', { content: content, sender, timestamp: newMessage.createdAt, _id: newMessage._id });
            } catch (e) {
                console.error("Error saving message:", e);
            }
        });

        socket.on('delete_message', ({ roomId, messageId }) => {
            io.to(roomId).emit('message_deleted', { messageId });
            console.log(`[CHAT] Message ${messageId} deleted in room ${roomId}`);
        });

        socket.on('bulk_delete_messages', ({ roomId, messageIds }) => {
            io.to(roomId).emit('messages_bulk_deleted', { messageIds });
            console.log(`[CHAT] ${messageIds.length} messages deleted in room ${roomId}`);
        });

        socket.on('cancel_search', () => {
            const index = waitingUsers.findIndex(u => u.socketId === socket.id);
            if (index !== -1) {
                waitingUsers.splice(index, 1);
                socket.emit('search_canceled');
            }
        });

        socket.on('send_invite', async ({ targetUserId, senderId }) => {
            try {
                const targetUser = await User.findById(targetUserId);
                const sender = await User.findById(senderId);

                if (targetUser && targetUser.socketId && sender) {
                    console.log(`[INVITE] Sending direct invite from ${sender.username} to ${targetUser.username}`);
                    io.to(targetUser.socketId).emit('match_invite', {
                        startUser: {
                            _id: sender._id,
                            username: sender.username,
                            skillsTeach: sender.skillsTeach,
                            skillsLearn: sender.skillsLearn,
                            rating: sender.rating || 0
                        }
                    });
                }
            } catch (err) {
                console.error("Error sending direct invite:", err);
            }
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);

            // If user was in a chat room, notify the other participant
            if (socket.roomId) {
                console.log(`[CHAT] User ${socket.id} disconnected from room ${socket.roomId}, broadcasting session_ended`);
                socket.to(socket.roomId).emit('session_ended', { roomId: socket.roomId });
            }

            // Remove from waiting queue
            const index = waitingUsers.findIndex(u => u.socketId === socket.id);
            if (index !== -1) {
                waitingUsers.splice(index, 1);
            }

            // Update online status
            try {
                const user = await User.findOneAndUpdate({ socketId: socket.id }, { isOnline: false, socketId: null });
                if (user) {
                    io.emit('user_status_changed', { userId: user._id, isOnline: false });
                }
            } catch (e) { console.error(e); }
        });
    });
};
