// File Location: client/src/layouts/NotificationsIndicator.tsx

import { useNotifications } from '../context/NotificationContext'; // <-- THIS LINE IS FIXED

const NotificationsIndicator = () => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className="notification-indicator">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
};

export default NotificationsIndicator;