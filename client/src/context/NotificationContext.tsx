// File Location: client/src/context/NotificationContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error("Failed to fetch notification count", error);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        refreshUnreadCount();
        
        // Optional: Poll every 60 seconds to keep it updated
        const interval = setInterval(refreshUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [refreshUnreadCount]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};