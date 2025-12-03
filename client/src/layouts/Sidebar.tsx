import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuLayoutDashboard, LuShoppingCart, LuPackage, LuUsers, LuFileText, LuTruck, LuClock, LuHistory, LuLogOut, LuSettings, LuBell, LuClipboardList } from 'react-icons/lu';
// --- FIX: Correct path (it is in the same folder) ---
import NotificationsIndicator from './NotificationsIndicator'; 
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
  onLogoutClick: () => void;
}

const Sidebar = ({ onLogoutClick }: SidebarProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  const userRoles = user.role || [];
  const hasRole = (role: UserRole) => userRoles.includes(role);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Gifti Pharmacy</div>
      <nav className="sidebar-nav">
        <ul>
          {/* == Universal Links == */}
          <li><NavLink to="/"><LuLayoutDashboard /><span>{t('sidebar.dashboard')}</span></NavLink></li>
          <li className="nav-item-with-indicator">
            <NavLink to="/notifications">
              <LuBell />
              <span>{t('sidebar.notifications')}</span>
            </NavLink>
            <NotificationsIndicator />
          </li>
          
          {/* == Cashier, Pharmacist & Admin Links == */}
          {(hasRole('cashier') || hasRole('pharmacist') || hasRole('admin')) && (
            <>
              <li><NavLink to="/point-of-sale"><LuShoppingCart /><span>{t('sidebar.pos')}</span></NavLink></li>
              <li><NavLink to="/sales-history"><LuClock /><span>{t('sidebar.salesHistory')}</span></NavLink></li>
            </>
          )}

          {/* == Pharmacist & Admin Links == */}
          {(hasRole('pharmacist') || hasRole('admin')) && (
            <>
              <li><NavLink to="/products"><LuPackage /><span>{t('sidebar.products')}</span></NavLink></li>
              <li><NavLink to="/suppliers"><LuTruck /><span>{t('sidebar.suppliers')}</span></NavLink></li>
              <li><NavLink to="/inventory"><LuPackage /><span>{t('sidebar.inventory')}</span></NavLink></li>
              <li><NavLink to="/purchase-orders"><LuFileText /><span>{t('sidebar.purchaseOrders')}</span></NavLink></li>
              <li><NavLink to="/reports"><LuClipboardList /><span>{t('sidebar.reports')}</span></NavLink></li>
            </>
          )}

          {/* == Admin Only Links == */}
          {hasRole('admin') && (
            <>
              <li><NavLink to="/user-management"><LuUsers /><span>{t('sidebar.users')}</span></NavLink></li>
              <li><NavLink to="/activity-log"><LuHistory /><span>{t('sidebar.activityLog')}</span></NavLink></li>
            </>
          )}

          {/* == Universal Links == */}
          <li><NavLink to="/settings"><LuSettings /><span>{t('sidebar.settings')}</span></NavLink></li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-role">
                {userRoles.map(r => t(`roles.${r}`)).join(', ')}
            </span>
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-icon logout-btn" title={t('sidebar.logout')} onClick={onLogoutClick}>
            <LuLogOut size={22} />
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;