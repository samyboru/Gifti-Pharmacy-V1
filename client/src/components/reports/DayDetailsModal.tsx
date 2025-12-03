// File Location: client/src/components/reports/DayDetailsModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';

// --- INTERFACE IS UPDATED ---
interface DaySaleItem {
    product_name: string;
    units_sold: string;
    selling_price: string;
    purchase_price: string | null;
    total_sales: string;
    total_profit: string;
}

interface DayDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
}

const DayDetailsModal = ({ isOpen, onClose, selectedDate }: DayDetailsModalProps) => {
    const { t } = useTranslation();
    const [data, setData] = useState<DaySaleItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && selectedDate) {
            setLoading(true);
            const dateString = selectedDate.toISOString().split('T')[0];

            api.get<DaySaleItem[]>(`/reports/sales-by-day?date=${dateString}`)
                .then(res => setData(res.data))
                .catch(err => console.error("Failed to fetch day details", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, selectedDate]);

    const title = selectedDate ? `Sales Details for ${selectedDate.toLocaleDateString()}` : 'Sales Details';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl"> {/* Increased size to accommodate new columns */}
            <div className="table-container" style={{padding: '1.5rem', margin: '1.5rem', border: 'none', boxShadow: 'none'}}>
                {loading ? (
                    <p className="text-center">{t('common.loading')}</p>
                ) : data.length === 0 ? (
                    <p className="text-center">No sales recorded on this day.</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th className="text-right">Units Sold</th>
                                {/* --- NEW COLUMNS ADDED --- */}
                                <th className="text-right">Purchase Price</th>
                                <th className="text-right">Selling Price</th>
                                <th className="text-right">Total Sales</th>
                                <th className="text-right">Total Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => {
                                const totalProfit = Number(item.total_profit);
                                const isLoss = totalProfit < 0;
                                return (
                                    <tr key={item.product_name}>
                                        <td>{item.product_name}</td>
                                        <td className="text-right">{Number(item.units_sold).toLocaleString()}</td>
                                        {/* --- NEW DATA CELLS ADDED --- */}
                                        <td className="text-right">{item.purchase_price ? formatCurrency(Number(item.purchase_price)) : t('common.notAvailable')}</td>
                                        <td className="text-right">{formatCurrency(Number(item.selling_price))}</td>
                                        <td className="text-right">{formatCurrency(Number(item.total_sales))}</td>
                                        {/* --- PROFIT CELL IS UPDATED --- */}
                                        <td className="text-right" style={{ color: isLoss ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 600 }}>
                                            {formatCurrency(totalProfit)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </Modal>
    );
};

export default DayDetailsModal;