import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MatchPage from './pages/MatchPage';
import InboxPage from './pages/InboxPage';
import ChatPage from './pages/ChatPage';
import FeedbackPage from './pages/FeedbackPage';
import Explore from './pages/Explore';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

const InviteListener = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const socket = io();

    socket.on('connect', () => {
      console.log('[App] Listening for invites with socket:', socket.id);
      socket.emit('join_user', user._id);
    });

    socket.on('match_invite', ({ startUser }) => {
      console.log('[App] Received match invite from:', startUser.username);
      toast((t) => (
        <div onClick={() => {
          toast.dismiss(t.id);
          navigate('/match', { state: { autoSearch: true } });
        }} className="cursor-pointer">
          <p className="font-bold">Match Opportunity! 🚀</p>
          <p>{startUser.username} <span className="text-yellow-500">★ {startUser.rating?.toFixed(1) || '0.0'}</span> is looking for your skills!</p>
          <p className="text-xs text-blue-500 mt-1">Click to Match Now</p>
        </div>
      ), { duration: 5000, icon: '👋' });
    });

    return () => socket.disconnect();
  }, [user, navigate]);

  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <InviteListener />
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/match" element={<MatchPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/chat/:roomId" element={<ChatPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/explore" element={<Explore />} />
            {/* Add more protected routes here */}
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
