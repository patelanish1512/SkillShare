import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Edit2, Check, X } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
    const { user, updateUserProfile, checkUserLoggedIn } = useAuth();
    const [newSkillTeach, setNewSkillTeach] = useState('');
    const [newSkillLearn, setNewSkillLearn] = useState('');
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));

    // Watch for theme changes and refresh profile
    useEffect(() => {
        if (checkUserLoggedIn) checkUserLoggedIn();

        // Initial check with a small delay to ensure Navbar has set the class
        const timer = setTimeout(() => {
            setDarkMode(document.documentElement.classList.contains('dark'));
        }, 100);

        const observer = new MutationObserver(() => {
            setDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, []);

    // Username editing state
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState(user?.username || '');
    const [usernameError, setUsernameError] = useState('');

    const chartData = {
        labels: ['Reputation', 'Sessions', 'Rated Sessions'],
        datasets: [
            {
                label: 'User Stats',
                data: [user?.rating || 0, user?.sessionsCompleted || 0, user?.totalRatings || 0],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: darkMode ? '#e5e7eb' : '#374151',
                    font: { size: 14 }
                }
            },
            title: {
                display: true,
                text: 'Your Performance',
                color: darkMode ? '#f9fafb' : '#111827',
                font: { size: 18, weight: 'bold' }
            },
        },
        scales: {
            y: {
                ticks: {
                    color: darkMode ? '#cbd5e1' : '#4b5563',
                    font: { weight: '500' }
                },
                grid: { color: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }
            },
            x: {
                ticks: {
                    color: darkMode ? '#cbd5e1' : '#4b5563',
                    font: { weight: '500' },
                    maxRotation: 0,
                    minRotation: 0
                },
                grid: { display: false }
            }
        }
    };

    const handleAddSkillTeach = async (e) => {
        e.preventDefault();
        if (!newSkillTeach.trim()) return;
        const updatedSkills = [...(user.skillsTeach || []), newSkillTeach.trim()];
        await updateUserProfile({ ...user, skillsTeach: updatedSkills });
        setNewSkillTeach('');
    };

    const handleAddSkillLearn = async (e) => {
        e.preventDefault();
        if (!newSkillLearn.trim()) return;
        const updatedSkills = [...(user.skillsLearn || []), newSkillLearn.trim()];
        await updateUserProfile({ ...user, skillsLearn: updatedSkills });
        setNewSkillLearn('');
    };

    const handleUpdateUsername = async () => {
        if (!newUsername.trim() || newUsername === user.username) {
            setIsEditingUsername(false);
            return;
        }

        try {
            await updateUserProfile({ ...user, username: newUsername });
            setIsEditingUsername(false);
            setUsernameError('');
        } catch (error) {
            setUsernameError('Username taken or invalid');
        }
    };

    const cancelEditUsername = () => {
        setIsEditingUsername(false);
        setNewUsername(user?.username || '');
        setUsernameError('');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Navbar />
            <div className="container mx-auto p-8">
                <div className="mb-8 flex items-center space-x-4">
                    <h1 className="text-3xl font-bold">Welcome,</h1>

                    {isEditingUsername ? (
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 border border-gray-400 dark:border-gray-500 focus:outline-none"
                            />
                            <button onClick={handleUpdateUsername} className="text-green-600 hover:text-green-500 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                                <Check size={20} />
                            </button>
                            <button onClick={cancelEditUsername} className="text-red-600 hover:text-red-500 bg-red-100 dark:bg-red-900/30 p-1 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl font-bold">{user?.username}</span>
                            <button onClick={() => { setIsEditingUsername(true); setNewUsername(user?.username); }} className="text-gray-500 hover:text-blue-500 transition">
                                <Edit2 size={20} />
                            </button>
                        </div>
                    )}
                    <span className="text-3xl">👋</span>
                </div>
                {usernameError && <p className="text-red-500 mb-6 -mt-6">{usernameError}</p>}

                {/* Discover New Skills Discovery Card */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition transform hover:scale-[1.01]">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold mb-1">Discover New Skills 🚀</h2>
                        <p className="opacity-90">Browse our public directory to find the perfect partner for your next exchange.</p>
                    </div>
                    <Link
                        to="/explore"
                        className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg whitespace-nowrap"
                    >
                        Explore Now
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors">
                        <h3 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">Reputation Score</h3>
                        <p className="text-4xl font-bold">{user?.rating?.toFixed(1) || 'N/A'}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors">
                        <h3 className="text-xl font-semibold mb-2 text-purple-600 dark:text-purple-400">Sessions Completed</h3>
                        <p className="text-4xl font-bold">{user?.sessionsCompleted || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors">
                        <h3 className="text-xl font-semibold mb-2 text-orange-600 dark:text-orange-400">Skills Taught</h3>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                            {user?.skillsTeach?.map((skill, i) => (
                                <span key={i} className="bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white px-2 py-1 rounded text-sm">{skill}</span>
                            )) || <span className="text-gray-500">None</span>}
                        </div>
                        <form onSubmit={handleAddSkillTeach} className="flex gap-2">
                            <input
                                type="text"
                                value={newSkillTeach}
                                onChange={(e) => setNewSkillTeach(e.target.value)}
                                placeholder="Add skill..."
                                className="w-full px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">+</button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors min-h-[400px]">
                        <Bar options={{ ...options, maintainAspectRatio: false }} data={chartData} height={350} />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors">
                        <h3 className="text-xl font-semibold mb-4 text-pink-600 dark:text-pink-400">Skills You Want to Learn</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {user?.skillsLearn?.map((skill, i) => (
                                <span key={i} className="bg-pink-100 dark:bg-pink-600 text-pink-800 dark:text-white px-2 py-1 rounded text-sm">{skill}</span>
                            )) || <span className="text-gray-500">None</span>}
                        </div>
                        <form onSubmit={handleAddSkillLearn} className="flex gap-2">
                            <input
                                type="text"
                                value={newSkillLearn}
                                onChange={(e) => setNewSkillLearn(e.target.value)}
                                placeholder="Add skill..."
                                className="w-full px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none"
                            />
                            <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded">+</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
