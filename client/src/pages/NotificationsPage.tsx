// File Location: client/src/pages/NotificationsPage.tsx

import { useState, useEffect, useCallback, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Notification } from '../types';
import toast from 'react-hot-toast';
import { 
  LuArchiveX, 
  LuCalendarClock, 
  LuPackageX, 
  LuTriangle, 
  LuBoxes, 
  LuCheck 
} from 'react-icons/lu';
import AlertDetailsModal from '../components/dashboard/AlertDetailsModal';
// --- FIX 1: Import the Context ---
import { useNotifications } from '../context/NotificationContext';

// Helper component to translate notification messages safely
const TranslatedMessage = ({ message }: { message: string }) => {
    const { t } = useTranslation();
    try {
        const parsed = JSON.parse(message);
        if (parsed.key) {
            return <>{t(parsed.key, parsed)}</>;
        }
    } catch (e) {
        console.warn("Failed to parse notification message:", message);
    }
    return <>{message}</>;
};

const NotificationItem = ({ notification, onAcknowledge, onItemClick }: { notification: Notification, onAcknowledge: (id: number) => void, onItemClick: (notif: Notification) => void }) => {
    const { t } = useTranslation();
    
    const getAlertIcon = (type: Notification['type']) => {
        switch (type) {
            case 'expired': return <div className="notification-icon expired"><LuArchiveX size={22} /></div>;
            case 'expiring_soon': return <div className="notification-icon expiring_soon"><LuCalendarClock size={22} /></div>;
            case 'out_of_stock': return <div className="notification-icon out_of_stock"><LuPackageX size={22} /></div>;
            case 'low_stock': return <div className="notification-icon low_stock"><LuBoxes size={22} /></div>;
            default: return <div className="notification-icon"><LuTriangle size={22} /></div>;
        }
    };

    const handleItemClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onItemClick(notification);
    };

    const handleAcknowledgeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAcknowledge(notification.id);
    };

    return (
        <div className={`notification-page-item ${notification.is_read ? 'is-read' : ''}`} onClick={handleItemClick}>
            {getAlertIcon(notification.type)}
            <div className="notification-content">
                <p className="notification-message">
                    <TranslatedMessage message={notification.message} />
                </p>
                <span className="notification-timestamp">
                    {new Date(notification.created_at).toLocaleString()}
                </span>
            </div>
            {!notification.is_read && (
                <button 
                    className="btn-icon dismiss-btn" 
                    title={t('notificationsPage.acknowledgeTooltip', 'Mark as Read')} 
                    onClick={handleAcknowledgeClick}
                >
                    <LuCheck size={20} />
                </button>
            )}
        </div>
    );
};

const NotificationsPage = (): JSX.Element => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    // --- FIX 2: Get refresh function from Context ---
    const { refreshUnreadCount } = useNotifications();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('unread');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const fetchNotifications = useCallback(() => {
        setLoading(true);
        api.get(`/notifications?status=${filter}`)
            .then(res => setNotifications(res.data))
            .catch(() => toast.error(t('notificationsPage.loadError', 'Failed to load notifications')))
            .finally(() => setLoading(false));
    }, [filter, t]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleAcknowledge = async (id: number) => {
        try {
            await api.put(`/notifications/${id}/read`);
            toast.success(t('notificationsPage.acknowledgeSuccess', "Marked as read"));
            
            // --- FIX 3: Refresh global badge AND local list ---
            await refreshUnreadCount();
            fetchNotifications(); 
            
        } catch (err) {
            console.error(err);
            toast.error(t('notificationsPage.acknowledgeError', "Failed to acknowledge notification."));
        }
    };

    const handleAcknowledgeAll = async () => {
        const toastId = toast.loading(t('notificationsPage.acknowledgingAll', 'Processing...'));
        try {
            await api.put('/notifications/mark-all-read');
            toast.success(t('notificationsPage.acknowledgeSuccess', 'All marked as read'), { id: toastId });
            
            // --- FIX 4: Refresh global badge AND local list ---
            await refreshUnreadCount();
            fetchNotifications();
            
        } catch (err) {
            toast.error(t('notificationsPage.acknowledgeError', 'Failed to update'), { id: toastId });
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (notification.type === 'out_of_stock') {
            if (notification.link) {
                navigate(notification.link);
            }
        } else {
            setSelectedNotification(notification);
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <div className="header">
                <h1>{t('notificationsPage.title', 'Notifications')}</h1>
                <button className="btn btn-secondary" onClick={handleAcknowledgeAll}>
                    {t('notificationsPage.acknowledgeAll', 'Mark All as Read')}
                </button>
            </div>
            <div className="content-card">
                <div className="table-toolbar">
                    <div className="segmented-control">
                        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                            {t('notificationsPage.all', 'All')}
                        </button>
                        <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>
                            {t('notificationsPage.unread', 'Unread')}
                        </button>
                        <button className={filter === 'read' ? 'active' : ''} onClick={() => setFilter('read')}>
                            {t('notificationsPage.read', 'Read')}
                        </button>
                    </div>
                </div>
                <div className="notification-list">
                    {loading ? (
                        <p className="text-center" style={{padding: '2rem'}}>{t('common.loading', 'Loading...')}</p>
                    ) : notifications.length === 0 ? (
                        <p className="text-center" style={{padding: '2rem'}}>{t('notificationsPage.noMatch', 'No notifications found.')}</p>
                    ) : (
                        notifications.map(notif => (
                            <NotificationItem 
                                key={notif.id} 
                                notification={notif} 
                                onAcknowledge={handleAcknowledge}
                                onItemClick={handleNotificationClick}
                            />
                        ))
                    )}
                </div>
            </div>
            
            <AlertDetailsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                notification={selectedNotification}
            />
        </>
    );
};

export default NotificationsPage;