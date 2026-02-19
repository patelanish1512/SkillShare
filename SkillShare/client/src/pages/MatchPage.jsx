import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { io } from 'socket.io-client';
import { useNavigate, useLocation } from 'react-router-dom';

import { toast } from 'react-hot-toast';

const MatchPage = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState('idle'); // idle, searching, matched
    const [partner, setPartner] = useState(null);
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();
    const { state } = useLocation();

    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[MatchPage] Connected to socket server with ID:', newSocket.id);
            if (user) {
                newSocket.emit('join_user', user._id);

                // Auto-start search or targeted invite
                if (state?.targetUser) {
                    console.log(`[MatchPage] Sending direct invite to ${state.targetUser.username}`);
                    setStatus('searching');
                    newSocket.emit('send_invite', {
                        targetUserId: state.targetUser._id,
                        senderId: user._id
                    });
                    // ALSO join the search queue so the target can find us!
                    newSocket.emit('find_match', { userId: user._id, targetUserId: state.targetUser._id });
                } else if (state?.autoSearch) {
                    console.log('[MatchPage] Auto-starting search from menu...');
                    setStatus('searching');
                    newSocket.emit('find_match', { userId: user._id });
                }
            }
        });

        newSocket.on('match_found', ({ roomId, partner }) => {
            console.log('[MatchPage] Match found event received!', partner);
            setPartner(partner);
            setStatus('matched');
            toast.success(`Match found! You are paired with ${partner.username}`);
            setTimeout(() => {
                navigate(`/chat/${roomId}`, { state: { partner } });
            }, 1500);
        });

        return () => {
            console.log('[MatchPage] Disconnecting socket...');
            newSocket.disconnect();
        };
    }, [user?._id, navigate, state?.autoSearch]); // Added state?.autoSearch to deps

    const findMatch = () => {
        if (!socket) return;
        setStatus('searching');
        socket.emit('find_match', { userId: user._id || user.id });
    };

    const cancelSearch = () => {
        if (!socket) return;
        socket.emit('cancel_search');
        setStatus('idle');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Navbar />
            <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
                <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 text-transparent bg-clip-text">
                    Find Your Skill Match
                </h1>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full transition-colors">
                    <div className="mb-6">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">You teach:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {user?.skillsTeach?.map(s => <span key={s} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">{s}</span>)}
                        </div>
                    </div>
                    <div className="mb-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">You want to learn:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {user?.skillsLearn?.map(s => <span key={s} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm">{s}</span>)}
                        </div>
                    </div>

                    {status === 'idle' && (
                        <button
                            onClick={findMatch}
                            className="w-full py-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition transform hover:scale-105 shadow-lg"
                        >
                            Find Match
                        </button>
                    )}

                    {status === 'searching' && (
                        <div className="animate-pulse">
                            <div className="w-16 h-16 border-4 border-t-blue-500 border-r-purple-500 border-b-blue-500 border-l-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Searching for a partner...</p>
                            <button onClick={cancelSearch} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline">Cancel</button>
                        </div>
                    )}

                    {status === 'matched' && (
                        <div className="text-green-600 dark:text-green-400">
                            <p className="text-2xl font-bold mb-2">Match Found!</p>
                            {partner && (
                                <p className="mb-2">You are paired with <span className="font-bold">{partner.username} (★ {partner.rating?.toFixed(1) || '0.0'})</span></p>
                            )}
                            <p>Redirecting to chat...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatchPage;
