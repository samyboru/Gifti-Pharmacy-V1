// File Location: client/src/pages/SalesHistoryPage.tsx

import { useState, useEffect, useMemo, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { Sale } from '../types';
import { LuSearch } from 'react-icons/lu';
import ReceiptModal from '../components/sales/ReceiptModal.tsx';
import { formatCurrency } from '../utils/currency';

const SalesHistoryPage = (): JSX.Element => {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    const fetchSalesHistory = async () => {
      try {
        const response = await api.get<Sale[]>('/sales');
        if(Array.isArray(response.data)) {
          setSales(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch sales history', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalesHistory();
  }, []);

  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return sales.filter(sale => 
        String(sale.id).includes(lowerSearchTerm) || 
        sale.cashier_name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [sales, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const openReceiptModal = (saleId: number) => {
    setSelectedSaleId(saleId);
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setSelectedSaleId(null);
    setIsReceiptModalOpen(false);
  };

  return (
    <>
      <div className="header">
        <h1>{t('salesHistoryPage.title')}</h1>
      </div>
      
      <div className="content-card">
        <div className="table-toolbar">
          <div className="search-container">
            <LuSearch className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder={t('salesHistoryPage.searchPlaceholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('salesHistoryPage.table.saleId')}</th>
                <th>{t('salesHistoryPage.table.dateTime')}</th>
                <th>{t('salesHistoryPage.table.cashier')}</th>
                <th>{t('salesHistoryPage.table.total')}</th>
                <th>{t('salesHistoryPage.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center">{t('salesHistoryPage.loading')}</td></tr>
              ) : filteredSales.length > 0 ? (
                filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td>#{sale.id}</td>
                    <td>{formatDate(sale.sale_date)}</td>
                    <td>{sale.cashier_name || t('common.notAvailable')}</td>
                    <td>{formatCurrency(Number(sale.total_amount))}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openReceiptModal(sale.id)}>
                        {t('salesHistoryPage.viewReceipt')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center">{t('salesHistoryPage.noSales')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
        saleId={selectedSaleId}
        context="history"
      />
    </>
  );
};

export default SalesHistoryPage;