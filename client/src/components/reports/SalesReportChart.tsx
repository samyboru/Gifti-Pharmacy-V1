// File Location: client/src/components/reports/SalesReportChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/currency';

interface ChartData {
  name: string;
  sales: number;
  date: string;
}

interface SalesReportChartProps {
  data: ChartData[];
  title: string;
  onChartClick?: (data: any) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${label}`}</p>
        <p className="intro">{`Sales: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

const SalesReportChart = ({ data, title, onChartClick }: SalesReportChartProps) => {
  return (
    <div className="content-card">
      <div className="content-card-header">
        <h2>{title}</h2>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={onChartClick}
            style={{ cursor: onChartClick ? 'pointer' : 'default' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="name" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" tickFormatter={(value) => formatCurrency(value as number).replace(' ETB', '')} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary-color)', strokeWidth: 1 }} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="var(--primary-color)" 
              strokeWidth={2} 
              name="Total Sales" 
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesReportChart;