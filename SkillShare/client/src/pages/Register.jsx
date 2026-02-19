import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // For skills, simple text input for now, ideally strictly typed tags
    const [skillsTeach, setSkillsTeach] = useState('');
    const [skillsLearn, setSkillsLearn] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            await register({
                username,
                email,
                password,
                skillsTeach: skillsTeach.split(',').map(s => s.trim()), // basic CSV parsing
                skillsLearn: skillsLearn.split(',').map(s => s.trim())
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Register</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Skills to Teach (comma separated)</label>
                        <input type="text" value={skillsTeach} onChange={(e) => setSkillsTeach(e.target.value)} placeholder="e.g. React, Python" className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Skills to Learn (comma separated)</label>
                        <input type="text" value={skillsLearn} onChange={(e) => setSkillsLearn(e.target.value)} placeholder="e.g. Guitar, Cooking" className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500" />
                    </div>
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-200">
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-purple-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
