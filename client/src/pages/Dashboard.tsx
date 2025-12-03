// File Location: client/src/pages/Dashboard.tsx

import { useEffect, useState, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  LuShoppingCart, 
  LuPackage, 
  LuUsers, 
  LuFileText, 
  LuShieldAlert, 
  LuArchiveX,      // <--- CHANGED: Using this icon (matches your Notifications)
  LuCalendarClock, 
  LuPackageX
} from 'react-icons/lu';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard'; 
import AlertsWidget from '../components/dashboard/AlertsWidget';
import WelcomeBanner from '../components/dashboard/WelcomeBanner';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { formatCurrency } from '../utils/currency';

interface DashboardStats {
  sales30Days: number;
  totalProducts: number;
  suppliers: number;
  pendingPOs: number;
  outOfStock: number;
  lowStock: number;
  expired: number;
  expiringSoon: number;
}

const Dashboard = (): JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const displayCount = (val?: number) => (val !== undefined && val !== null) ? val : '-';

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>{t('common.loading')}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>{t('dashboard.title')}</h1>
        <LanguageSwitcher />
      </div>

      <WelcomeBanner />

      <div className="stats-grid">
        {/* Row 1: General Stats */}
        <StatCard 
          title={t('dashboard.sales30Days')} 
          value={stats ? formatCurrency(stats.sales30Days) : '...'} 
          icon={<LuShoppingCart size={24} />} 
          color="green" 
        />
        <StatCard 
          title={t('dashboard.totalProducts')} 
          value={displayCount(stats?.totalProducts)} 
          icon={<LuPackage size={24} />} 
          color="blue" 
          onClick={() => navigate('/products')}
        />
        <StatCard 
          title={t('dashboard.suppliers')} 
          value={displayCount(stats?.suppliers)} 
          icon={<LuUsers size={24} />} 
          color="purple" 
          onClick={() => navigate('/suppliers')}
        />
        <StatCard 
          title={t('dashboard.pendingPOs')} 
          value={displayCount(stats?.pendingPOs)} 
          icon={<LuFileText size={24} />} 
          color="yellow" 
          onClick={() => navigate('/purchase-orders?status=Pending')}
        />
        
        {/* Row 2: Inventory Health */}
        <StatCard 
          title={t('dashboard.expired')} 
          value={displayCount(stats?.expired)} 
          icon={<LuArchiveX size={24} />} 
          color="red" 
          onClick={() => navigate('/inventory?status=expired')}
        />
        <StatCard 
          title={t('dashboard.expiringSoon')} 
          value={displayCount(stats?.expiringSoon)} 
          icon={<LuCalendarClock size={24} />}
          color="orange" 
          onClick={() => navigate('/inventory?status=expiring_soon')}
        />
        <StatCard 
          title={t('dashboard.outOfStock')} 
          value={displayCount(stats?.outOfStock)} 
          icon={<LuPackageX size={24} />}
          color="red" 
          onClick={() => navigate('/inventory?status=out_of_stock')}
        />
        <StatCard 
          title={t('dashboard.lowOnStock')} 
          value={displayCount(stats?.lowStock)} 
          icon={<LuShieldAlert size={24} />} 
          color="yellow" 
          onClick={() => navigate('/inventory?status=low_stock')}
        />
      </div>

      <div className="dashboard-lower-section">
        <AlertsWidget />
      </div>
    </div>
  );
};

export default Dashboard;