// File Location: client/src/pages/ReportsPage.tsx

import { useState, useEffect, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend 
} from 'recharts';
import { formatCurrency } from '../utils/currency';
import { LuCalendar, LuDollarSign, LuTrendingUp, LuShoppingCart, LuPackage } from 'react-icons/lu';

// Define types matching the NEW Backend Response
interface ReportStats {
  revenue: number;       // Matches backend
  profit: number;        // Matches backend
  transactions: number;  // Matches backend
  itemsSold: number;     // Matches backend
  margin: number;        // Matches backend
}

interface SalesDataPoint {
  date: string;
  sales: number;
  profit: number;
}

interface TopProduct {
  name: string;
  total_sold: number;
  revenue: number;
}

const ReportsPage = (): JSX.Element => {
  const { t } = useTranslation();
  
  // State
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Range (Default to last 30 days)
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      // Fetch all data in parallel
      const [statsRes, chartRes, productsRes] = await Promise.all([
        api.get<ReportStats>('/reports/stats', { params }),
        api.get<SalesDataPoint[]>('/reports/sales-summary', { params }),
        api.get<TopProduct[]>('/reports/top-products', { params })
      ]);

      setStats(statsRes.data);
      setSalesData(chartRes.data);
      setTopProducts(productsRes.data);

    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FIX: Loading State to prevent "undefined" crash ---
  if (loading && !stats) {
      return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: '#fff' }}>
              <p>Loading reports...</p>
          </div>
      );
  }

  return (
    <div className="reports-page">
      
      {/* Header & Date Picker */}
      <div className="reports-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#fff', margin: 0 }}>{t('sidebar.reports')}</h1>
        
        <div className="date-filters" style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
            <div className="date-input-group">
                <LuCalendar style={{ marginRight: '8px', color: '#888' }} />
                <DatePicker 
                    selected={startDate} 
                    onChange={(date) => date && setStartDate(date)} 
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="bg-transparent text-white border-none outline-none"
                />
            </div>
            <span style={{ color: '#666' }}>—</span>
            <div className="date-input-group">
                <DatePicker 
                    selected={endDate} 
                    onChange={(date) => date && setEndDate(date)} 
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="bg-transparent text-white border-none outline-none"
                />
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="stat-card" style={cardStyle}>
                <div className="icon-box" style={{ ...iconBoxStyle, background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}><LuDollarSign size={24} /></div>
                <div>
                    <p style={labelStyle}>Total Revenue</p>
                    <h3 style={valueStyle}>{formatCurrency(stats.revenue)}</h3>
                </div>
            </div>
            <div className="stat-card" style={cardStyle}>
                <div className="icon-box" style={{ ...iconBoxStyle, background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' }}><LuTrendingUp size={24} /></div>
                <div>
                    <p style={labelStyle}>Total Profit</p>
                    <h3 style={valueStyle}>{formatCurrency(stats.profit)}</h3>
                    <small style={{ color: '#60a5fa' }}>{stats.margin}% Margin</small>
                </div>
            </div>
            <div className="stat-card" style={cardStyle}>
                <div className="icon-box" style={{ ...iconBoxStyle, background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}><LuShoppingCart size={24} /></div>
                <div>
                    <p style={labelStyle}>Transactions</p>
                    <h3 style={valueStyle}>{stats.transactions}</h3>
                </div>
            </div>
            <div className="stat-card" style={cardStyle}>
                <div className="icon-box" style={{ ...iconBoxStyle, background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}><LuPackage size={24} /></div>
                <div>
                    <p style={labelStyle}>Items Sold</p>
                    <h3 style={valueStyle}>{stats.itemsSold}</h3>
                </div>
            </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Sales Trend Line Chart */}
        <div className="chart-card" style={{ ...cardStyle, height: '400px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#fff' }}>Sales Trend</h3>
            <div style={{ flex: 1, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="sales" name="Revenue" stroke="#34d399" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="profit" name="Profit" stroke="#60a5fa" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Top Products List */}
        <div className="chart-card" style={{ ...cardStyle, height: '400px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Top Products</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #374151', textAlign: 'left' }}>
                        <th style={{ padding: '8px', color: '#9ca3af', fontSize: '0.85rem' }}>Product</th>
                        <th style={{ padding: '8px', color: '#9ca3af', fontSize: '0.85rem', textAlign: 'right' }}>Sold</th>
                        <th style={{ padding: '8px', color: '#9ca3af', fontSize: '0.85rem', textAlign: 'right' }}>Rev</th>
                    </tr>
                </thead>
                <tbody>
                    {topProducts.map((prod, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #374151' }}>
                            <td style={{ padding: '12px 8px', color: '#fff' }}>{prod.name}</td>
                            <td style={{ padding: '12px 8px', color: '#fff', textAlign: 'right' }}>{prod.total_sold}</td>
                            <td style={{ padding: '12px 8px', color: '#34d399', textAlign: 'right' }}>{formatCurrency(Number(prod.revenue))}</td>
                        </tr>
                    ))}
                    {topProducts.length === 0 && (
                        <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No sales data</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};

// Internal styles for simplicity
const cardStyle = {
    background: 'var(--bg-secondary)',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid var(--border-color)'
};

const iconBoxStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem'
};

const labelStyle = {
    margin: '0 0 0.5rem 0',
    color: '#9ca3af',
    fontSize: '0.9rem'
};

const valueStyle = {
    margin: 0,
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: '600'
};

export default ReportsPage;