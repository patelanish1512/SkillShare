import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Calendar } from 'lucide-react';

const InboxPage = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data } = await api.get('/chats');
                setChats(data);
            } catch (error) {
                console.error("Error fetching chats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, []);

    const getPartner = (participants) => {
        return participants.find(p => p._id !== user._id) || { username: 'Unknown' };
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
            <Navbar />
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Your Inbox
                </h1>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : chats.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                        <MessageSquare className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">No conversations yet</h3>
                        <p className="text-gray-500 mt-2">Find a match to start chatting!</p>
                        <Link to="/match" className="mt-6 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            Find Match
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {chats.map(chat => {
                            const partner = getPartner(chat.participants);
                            return (
                                <Link
                                    key={chat._id}
                                    to={`/chat/${chat._id}`}
                                    state={{ partner: { username: partner.username, id: partner._id } }}
                                    className="block bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 group shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                                                    {partner.username[0]?.toUpperCase()}
                                                </div>
                                                {partner.isOnline && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                                                    {partner.username} <span className="text-yellow-500 text-sm">★ {partner.rating?.toFixed(1) || '0.0'}</span>
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-md">
                                                    {chat.lastMessage || <span className="italic text-gray-600">No messages yet</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-col items-end">
                                            <span className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(chat.updatedAt).toLocaleDateString()}
                                            </span>
                                            <span className="mt-1">
                                                {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxPage;
