import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            setUser(data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setUser(data.user);
    };

    const register = async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        setUser(data.user);
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
    };

    const updateUserProfile = async (data) => {
        const res = await api.put('/auth/profile', data);
        setUser(res.data.user);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserProfile, checkUserLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};
