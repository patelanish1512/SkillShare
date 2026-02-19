import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Send, XCircle, Smile, Trash2, MoreVertical } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../utils/api';

import { toast } from 'react-hot-toast';

const ChatPage = () => {
    const { roomId } = useParams();
    const { state } = useLocation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [partner, setPartner] = useState(state?.partner || null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const messagesEndRef = useRef(null);
    const partnerRef = useRef(partner);

    // Update ref whenever partner changes
    useEffect(() => {
        partnerRef.current = partner;
    }, [partner]);

    // Separate Effect for Socket Connection
    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join_room', { roomId });
        });

        newSocket.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
            if (message.sender !== user.username) {
                toast(`New message from ${message.sender}`, { icon: '💬' });
            }
        });

        newSocket.on('message_deleted', ({ messageId }) => {
            console.log(`[CHAT] Removing deleted message: ${messageId}`);
            setMessages(prev => prev.filter(msg => (msg._id || msg.id) !== messageId));
        });

        newSocket.on('messages_bulk_deleted', ({ messageIds }) => {
            console.log(`[CHAT] Removing ${messageIds.length} bulk deleted messages`);
            setMessages(prev => prev.filter(msg => !messageIds.includes(msg._id || msg.id)));
        });

        newSocket.on('user_status_changed', ({ userId, isOnline }) => {
            setPartner(prev => {
                if (prev && (prev.id === userId || prev._id === userId)) {
                    return { ...prev, isOnline };
                }
                return prev;
            });
        });

        newSocket.on('session_ended', () => {
            toast.error('The other user has ended the session.', { id: 'session-end' });
            setTimeout(() => {
                navigate('/feedback', {
                    state: {
                        partnerId: partnerRef.current?.id,
                        username: partnerRef.current?.username || 'User',
                        roomId
                    }
                });
            }, 2000);
        });

        return () => {
            console.log('[CHAT] Disconnecting socket...');
            newSocket.disconnect();
        };
    }, [roomId]); // ONLY depend on roomId

    // Separate Effect for data fetching
    useEffect(() => {
        // Fetch chat history
        const fetchHistory = async () => {
            try {
                const { data } = await api.get(`/chats/${roomId}`);
                setMessages(data);
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };

        // Fetch partner info if missing
        const fetchPartnerInfo = async () => {
            if (partnerRef.current) return; // Use partnerRef here
            try {
                const { data } = await api.get(`/chats/${roomId}/info`);
                const otherUser = data.participants.find(p => p._id !== user._id);
                if (otherUser) {
                    setPartner({
                        username: otherUser.username,
                        id: otherUser._id,
                        rating: otherUser.rating,
                        isOnline: otherUser.isOnline
                    });
                }
            } catch (error) {
                console.error("Error fetching partner info:", error);
            }
        };

        fetchHistory();
        fetchPartnerInfo();

        if (state?.partner) {
            toast.success(`Joined chat with ${state.partner.username}`, { id: `join-${roomId}` });
        }
    }, [roomId]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        const trimmedMessage = newMessage.trim();
        if (!trimmedMessage || !socket) return;

        const messageData = {
            roomId,
            content: trimmedMessage,
            sender: user.username,
            timestamp: new Date().toLocaleTimeString()
        };

        socket.emit('send_message', messageData);
        setNewMessage('');
        setShowEmojiPicker(false);
    };

    const deleteMessage = async (messageId) => {
        try {
            await api.delete(`/chats/messages/${messageId}`);
            socket.emit('delete_message', { roomId, messageId });
            setMessages(prev => prev.filter(msg => (msg._id || msg.id) !== messageId));
            toast.success('Message deleted');
        } catch (error) {
            console.error("Error deleting message:", error);
            toast.error('Failed to delete message');
        }
    };

    const toggleMessageSelection = (messageId) => {
        setSelectedIds(prev => 
            prev.includes(messageId) 
                ? prev.filter(id => id !== messageId) 
                : [...prev, messageId]
        );
    };

    const bulkDeleteMessages = async () => {
        if (selectedIds.length === 0) return;
        try {
            await api.post('/chats/messages/bulk-delete', { messageIds: selectedIds });
            socket.emit('bulk_delete_messages', { roomId, messageIds: selectedIds });
            setMessages(prev => prev.filter(msg => !selectedIds.includes(msg._id || msg.id)));
            setSelectedIds([]);
            setSelectionMode(false);
            toast.success(`${selectedIds.length} messages deleted`);
        } catch (error) {
            console.error("Error bulk deleting messages:", error);
            toast.error('Failed to delete messages');
        }
    };

    const handleEndSessionClick = () => {
        setShowModal(true);
    };

    const confirmEndSession = () => {
        console.log('[CHAT] confirmEndSession clicked. Socket:', socket?.connected ? 'connected' : 'disconnected');

        const feedbackData = {
            partnerId: partner?.id,
            username: partner?.username || 'User',
            roomId
        };

        if (socket && socket.connected) {
            // Emitting to server with timeout fallback
            console.log('[CHAT] Emitting leave_room to server...');

            // Set a safety timeout in case server doesn't respond
            const timeout = setTimeout(() => {
                console.log('[CHAT] leave_room acknowledgment timed out. Navigating anyway...');
                toast.success('Session ended (offline)');
                navigate('/feedback', { state: feedbackData });
            }, 2000);

            socket.emit('leave_room', { roomId }, () => {
                console.log('[CHAT] Received leave_room acknowledgment from server');
                clearTimeout(timeout);
                toast.success('Session ended');
                navigate('/feedback', { state: feedbackData });
            });
        } else {
            // Socket not available, just navigate
            console.log('[CHAT] Socket not available for leave_room. Navigating directly.');
            toast.success('Session ended');
            navigate('/feedback', { state: feedbackData });
        }
    };

    const displayPartner = partner || { username: 'Anonymous' };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col transition-colors duration-200">
            <Navbar />

            <div className="flex-1 container mx-auto p-4 flex flex-col max-w-4xl">
                <div className="bg-white dark:bg-gray-800 rounded-t-lg p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {displayPartner.username[0]}
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">
                                {displayPartner.username} {displayPartner.rating !== undefined && (
                                    <span className="text-yellow-500 text-sm">★ {displayPartner.rating?.toFixed(1) || '0.0'}</span>
                                )}
                            </h2>
                            <p className={`text-xs ${displayPartner.isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                {displayPartner.isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {selectionMode ? (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{selectedIds.length} selected</span>
                                <button 
                                    onClick={bulkDeleteMessages}
                                    disabled={selectedIds.length === 0}
                                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm transition"
                                >
                                    Delete
                                </button>
                                <button 
                                    onClick={() => { setSelectionMode(false); setSelectedIds([]); }}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setSelectionMode(true)}
                                className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title="Select multiple"
                            >
                                <MoreVertical size={20} />
                            </button>
                        )}
                        <button onClick={handleEndSessionClick} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center space-x-1 px-3 py-1 rounded bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 transition">
                            <XCircle size={18} />
                            <span>End Session</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-gray-900 p-4 overflow-y-auto space-y-4 border-l border-r border-gray-200 dark:border-gray-700">
                    {messages.filter(msg => (msg.content || msg.message)?.trim().length > 0).map((msg, i) => {
                        const isSelected = selectedIds.includes(msg._id || msg.id);
                        return (
                            <div key={i} className={`flex items-center space-x-2 ${msg.sender === user.username ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                                {selectionMode && msg.sender === user.username && (
                                    <input 
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleMessageSelection(msg._id || msg.id)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                )}
                                <div className={`group max-w-[80%] min-w-[50px] p-3 rounded-2xl shadow-sm ${msg.sender === user.username ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'} ${isSelected ? 'ring-2 ring-blue-400' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <p className="whitespace-pre-wrap break-words">{msg.content || msg.message}</p>
                                        {!selectionMode && (msg._id || msg.id) && msg.sender === user.username && (
                                            <button
                                                onClick={() => deleteMessage(msg._id || msg.id)}
                                                className="ml-2 text-blue-200 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Delete message"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className={`text-xs opacity-70 mt-1 text-right ${msg.sender === user.username ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{msg.timestamp}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-b-lg border-t border-gray-200 dark:border-gray-700 shadow-sm relative">
                    {showEmojiPicker && (
                        <div className="absolute bottom-full mb-2 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl p-3 flex flex-wrap gap-3 max-w-[280px] z-30 animate-in fade-in slide-in-from-bottom-2">
                            {['😊', '😂', '❤️', '👍', '🙌', '🔥', '🤔', '😎', '👋', '🎉', '✨', '💯', '🙏', '😢', '🚀'].map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => { addEmoji(emoji); setShowEmojiPicker(false); }}
                                    className="text-2xl hover:scale-125 transition transform active:scale-90"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={sendMessage} className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/40' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <Smile size={24} />
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onFocus={() => setShowEmojiPicker(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(e);
                                }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition transform active:scale-95 shadow-lg">
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* End Session Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all scale-100 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">End Session?</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to leave this chat? This will end the current session.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEndSession}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition shadow-lg"
                            >
                                End Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
