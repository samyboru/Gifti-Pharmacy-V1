// File Location: client/src/components/dashboard/AlertsWidget.tsx

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Notification } from '../../types';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { LuArchiveX, LuCalendarClock, LuPackageX, LuTriangle, LuBoxes } from 'react-icons/lu';
import AlertDetailsModal from './AlertDetailsModal';

// Helper component to translate notification messages
const TranslatedMessage = ({ message }: { message: string }) => {
    const { t } = useTranslation();
    try {
        const parsed = JSON.parse(message);
        if (parsed.key) {
            // This t() call looks up "notifications.expired" in your json file
            return <>{t(parsed.key, parsed)}</>;
        }
    } catch (e) {
        // Not a JSON string? Return as is.
    }
    return <>{message}</>;
};

const AlertItem = ({ notification, onClick }: { notification: Notification; onClick: () => void }) => {
  const getAlertIcon = (type: Notification['type']) => {
    switch (type) {
      case 'expired': return <div className="alert-icon-wrapper red"><LuArchiveX size={20} /></div>;
      case 'expiring_soon': return <div className="alert-icon-wrapper yellow"><LuCalendarClock size={20} /></div>;
      case 'out_of_stock': return <div className="alert-icon-wrapper red"><LuPackageX size={20} /></div>;
      case 'low_stock': return <div className="alert-icon-wrapper yellow"><LuBoxes size={20} /></div>;
      default: return <div className="alert-icon-wrapper"><LuTriangle size={20} /></div>;
    }
  };

  return (
    <div onClick={onClick} className="alert-item clickable">
      {getAlertIcon(notification.type)}
      <div className="alert-content">
        <p className="alert-message">
            {/* Uses the helper above */}
            <TranslatedMessage message={notification.message} />
        </p>
      </div>
    </div>
  );
};

const AlertsWidget = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { unreadCount } = useNotifications(); // Assumes you have this context, otherwise remove
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
        const res = await api.get<Notification[]>('/notifications?status=unread&limit=5');
        setAlerts(res.data);
    } catch (err) {
        console.error("Failed to fetch alerts", err);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, unreadCount]);

  const handleAlertClick = (notification: Notification) => {
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
      <div className="content-card alerts-widget-card">
        <div className="content-card-header">
          <h2>{t('alertsWidget.unreadNotifications', 'Unread Notifications')}</h2>
          <Link to="/notifications" className="btn-link">{t('alertsWidget.viewAll', 'View All')}</Link>
        </div>
        <div className="alerts-list">
          {isLoading ? (
            <p className="placeholder-text">{t('alertsWidget.loading', 'Loading...')}</p>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <AlertItem key={alert.id} notification={alert} onClick={() => handleAlertClick(alert)} />
            ))
          ) : (
            <p className="placeholder-text">{t('alertsWidget.noUnread', 'No unread notifications.')}</p>
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

export default AlertsWidget;