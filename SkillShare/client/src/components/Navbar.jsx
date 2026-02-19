import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        await logout();
        setShowLogoutModal(false);
        navigate('/login');
    };

    return (
        <>
            <nav className="bg-white dark:bg-gray-800 p-4 shadow-md transition-colors duration-200 relative z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        SkillShare
                    </Link>
                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex space-x-6">
                            <Link to="/dashboard" className={`hover:text-blue-600 font-semibold transition ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>Dashboard</Link>
                            <Link to="/explore" className={`hover:text-blue-600 font-semibold transition ${location.pathname === '/explore' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>Explore</Link>
                            <Link to="/match" className={`hover:text-blue-600 font-semibold transition ${location.pathname === '/match' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>Find Match</Link>
                            <Link to="/inbox" className={`hover:text-blue-600 font-semibold transition ${location.pathname === '/inbox' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>Inbox</Link>
                        </div>
                        <button onClick={() => setDarkMode(!darkMode)} className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition">
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                            <User size={20} />
                            <span>{user?.username}</span>
                        </div>
                        <button onClick={handleLogoutClick} className="flex items-center space-x-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all scale-100">
                        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Confirm Logout</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to log out of your account?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition shadow-lg"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
