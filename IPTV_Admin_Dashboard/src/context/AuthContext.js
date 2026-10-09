import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('iptv_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    const [token, setToken] = useState(() => localStorage.getItem('iptv_token') || null);
    const [loading, setLoading] = useState(true);

    // Verify token validity on initial load
    useEffect(() => {
        const verifySession = async () => {
            const storedToken = localStorage.getItem('iptv_token');
            if (!storedToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await AuthAPI.get('/me', {
                    headers: { Authorization: `Bearer ${storedToken}` }
                });
                if (response.data) {
                    setUser(response.data);
                    localStorage.setItem('iptv_user', JSON.stringify(response.data));
                }
            } catch (err) {
                console.warn('Session verification failed, clearing auth:', err.message);
                localStorage.removeItem('iptv_token');
                localStorage.removeItem('iptv_user');
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    const login = async (username, password) => {
        const response = await AuthAPI.post('/login', { username, password });
        const { token: receivedToken, user: receivedUser } = response.data;

        localStorage.setItem('iptv_token', receivedToken);
        localStorage.setItem('iptv_user', JSON.stringify(receivedUser));

        setToken(receivedToken);
        setUser(receivedUser);

        return receivedUser;
    };

    const logout = () => {
        localStorage.removeItem('iptv_token');
        localStorage.removeItem('iptv_user');
        setUser(null);
        setToken(null);
        window.location.href = '/login';
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('iptv_user', JSON.stringify(updatedUser));
    };

    const isSuperAdmin = user?.role === 'super_admin';
    const isAdmin = user?.role === 'admin';
    const isClientUser = user?.role === 'client_user';
    const canManageContent = isSuperAdmin;
    const canManageUsers = isSuperAdmin;
    const canManageClients = isSuperAdmin || isAdmin;

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isSuperAdmin,
        isAdmin,
        isClientUser,
        canManageContent,
        canManageUsers,
        canManageClients,
        login,
        logout,
        updateUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
