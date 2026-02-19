import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { Search, User as UserIcon, Star, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/auth/users');
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const query = searchTerm.toLowerCase();
        return (
            user.username.toLowerCase().includes(query) ||
            user.skillsTeach.some(s => s.toLowerCase().includes(query)) ||
            user.skillsLearn.some(s => s.toLowerCase().includes(query))
        );
    });

    const handleInvite = (user) => {
        // Direct to match page with potential auto-search or just open a chat
        // For now, let's just toast or navigate to match
        navigate('/match', { state: { targetUser: user, autoSearch: true } });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 text-transparent bg-clip-text">
                            Explore Skills
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Find the perfect partner to exchange knowledge with.</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search skills or usernames..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((user) => (
                            <div key={user._id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                            <UserIcon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                                {user.username}
                                            </h3>
                                            <div className="flex items-center text-yellow-500 text-sm font-semibold">
                                                <Star size={14} className="fill-yellow-500 mr-1" />
                                                {user.rating?.toFixed(1) || '0.0'}
                                                <span className="text-gray-400 font-normal ml-2">({user.sessionsCompleted || 0} sessions)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2 tracking-widest">Teaches</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user.skillsTeach?.map(skill => (
                                                <span key={skill} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-2 tracking-widest">Wants to Learn</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user.skillsLearn?.map(skill => (
                                                <span key={skill} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-medium rounded-full border border-purple-100 dark:border-purple-800">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleInvite(user)}
                                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition duration-200 flex items-center justify-center space-x-2 shadow-sm"
                                >
                                    <MessageSquare size={18} />
                                    <span>Send Invite</span>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">No partners found matching "{searchTerm}"</p>
                        <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-500 hover:underline">Clear search</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Explore;
