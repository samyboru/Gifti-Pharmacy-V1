// File Location: client/src/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Toaster } from 'react-hot-toast';

// Import Layouts
import RootLayout from './layouts/RootLayout.tsx';
import AuthLayout from './layouts/AuthLayout.tsx'; 

// Import All Pages
import LoginPage from './pages/LoginPage.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ProductsPage from './pages/ProductsPage.tsx';
import ProductDetailsPage from './pages/ProductDetailsPage.tsx';
import SuppliersPage from './pages/SuppliersPage.tsx';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage.tsx';
import SalesHistoryPage from './pages/SalesHistoryPage.tsx';
import UserManagement from './pages/UserManagement.tsx';
import ActivityLogPage from './pages/ActivityLogPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import PointOfSalePage from './pages/PointOfSalePage.tsx';
import InventoryPage from './pages/InventoryPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import EnterCodePage from './pages/EnterCodePage.tsx';
import CreateNewPasswordPage from './pages/CreateNewPasswordPage.tsx';
import CashierQueuePage from './pages/CashierQueuePage.tsx';
import NotificationsPage from './pages/NotificationsPage.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
// --- THIS IS THE CHANGE: Import the success page ---
import PasswordResetSuccessPage from './pages/PasswordResetSuccessPage.tsx';


function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 4000, style: { background: 'var(--widget-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', }, }} />
            <Routes>
              {/* Routes for login, password reset, etc., now use the blank AuthLayout */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/enter-code" element={<EnterCodePage />} />
                <Route path="/create-new-password" element={<CreateNewPasswordPage />} />
                {/* --- THIS IS THE CHANGE: Added the route for the success page --- */}
                <Route path="/password-reset-success" element={<PasswordResetSuccessPage />} />
              </Route>
              
              {/* All main application routes still use the RootLayout with the sidebar */}
              <Route element={<RootLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/point-of-sale" element={<PointOfSalePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailsPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="/sales-history" element={<SalesHistoryPage />} />
                <Route path="/queue" element={<CashierQueuePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/activity-log" element={<ActivityLogPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;