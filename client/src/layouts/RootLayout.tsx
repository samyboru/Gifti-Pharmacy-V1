// File Location: client/src/layouts/RootLayout.tsx

import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import ConfirmLogoutModal from '../components/common/ConfirmLogoutModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import LoadingScreen from '../components/common/LoadingScreen.tsx';

const RootLayout = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // --- START: BROWSER HISTORY LOCK (Disable Back/Forward) ---
  useEffect(() => {
    // 1. Push the current state into the history stack immediately
    window.history.pushState(null, document.title, window.location.href);

    // 2. Listen for the "popstate" event (which happens when Back/Forward is clicked)
    const handlePopState = () => {
      // 3. Immediately push the state again, effectively canceling the "Back" action
      window.history.pushState(null, document.title, window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location]); // Re-apply logic whenever the route changes
  // --- END: BROWSER HISTORY LOCK ---

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logic: If strictly a cashier (no admin/pharmacist role), force them to the queue page.
  if (user.role.includes('cashier') && !user.role.includes('admin') && !user.role.includes('pharmacist') && location.pathname !== '/queue') {
    return <Navigate to="/queue" replace />;
  }
  
  // Logic: If NOT a cashier, they shouldn't be on the queue page.
  if (!user.role.includes('cashier') && location.pathname === '/queue') {
    return <Navigate to="/" replace />;
  }

  const handleLogoutConfirm = () => {
    logout();
  };
  
  return (
    <>
      <Sidebar onLogoutClick={() => setIsLogoutModalOpen(true)} />
      
      <main className="main-content">
        <Outlet />
      </main>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default RootLayout;