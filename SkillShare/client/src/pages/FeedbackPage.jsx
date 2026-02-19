import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { Star } from 'lucide-react';

const FeedbackPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hover, setHover] = useState(0);

    const partnerId = state?.partnerId;
    const username = state?.username || 'User';
    const sessionId = state?.roomId || 'unknown';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return alert('Please provide a rating');

        try {
            await api.post('/feedback', {
                toUserId: partnerId,
                rating,
                comment,
                sessionId
            });
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to submit feedback');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Navbar />
            <div className="flex items-center justify-center h-[80vh]">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center transition-colors">
                    <h2 className="text-3xl font-bold mb-4 text-purple-600 dark:text-purple-400">Session Feedback</h2>
                    <p className="mb-6 text-gray-600 dark:text-gray-300">How was your session with <span className="font-bold text-gray-900 dark:text-white">{username}</span>?</p>

                    <div className="flex justify-center space-x-2 mb-6">
                        {[...Array(5)].map((_, index) => {
                            const ratingValue = index + 1;
                            return (
                                <Star
                                    key={index}
                                    size={32}
                                    className={`cursor-pointer transition ${ratingValue <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`}
                                    onClick={() => setRating(ratingValue)}
                                    onMouseEnter={() => setHover(ratingValue)}
                                    onMouseLeave={() => setHover(0)}
                                />
                            );
                        })}
                    </div>

                    <textarea
                        className="w-full bg-gray-100 dark:bg-gray-700 rounded p-3 text-gray-900 dark:text-white mb-6 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-300 dark:border-gray-600 transition-colors"
                        rows="4"
                        placeholder="Share your experience (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    ></textarea>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded transition transform hover:scale-105"
                    >
                        Submit Feedback
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm underline">
                        Skip
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;
