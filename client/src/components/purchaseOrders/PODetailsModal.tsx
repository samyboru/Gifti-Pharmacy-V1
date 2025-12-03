// File Location: client/src/components/purchaseOrders/PODetailsModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { PurchaseOrderDetails } from '../../types';
import { formatCurrency } from '../../utils/currency.ts';

// Interface defining a history entry
interface HistoryEntry {
  action: string;
  changed_by_name: string;
  changed_at: string;
}

interface ExtendedPurchaseOrderDetails extends PurchaseOrderDetails {
  created_by_name?: string;
  history?: HistoryEntry[]; // Array of history items
}

interface PODetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: number | null;
}

const PODetailsModal = ({ isOpen, onClose, purchaseOrderId }: PODetailsModalProps) => {
  const { t } = useTranslation();
  const [poDetails, setPoDetails] = useState<ExtendedPurchaseOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && purchaseOrderId) {
      setLoading(true);
      api.get<ExtendedPurchaseOrderDetails>(`/purchase-orders/${purchaseOrderId}`)
        .then(res => setPoDetails(res.data))
        .catch(err => console.error("Failed to fetch PO details", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, purchaseOrderId]);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  // Helper to color code actions
  const getActionColor = (action: string) => {
      switch(action) {
          case 'Created': return 'var(--text-primary)';
          case 'Edited': return '#ebdf8a'; // Yellow
          case 'Received': return '#8aebbd'; // Green
          case 'Cancelled': return '#ff6b6b'; // Red
          default: return '#aaa';
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('poDetailsModal.title', { id: purchaseOrderId })} size="lg">
      <div className="po-details-container">
        {loading && <p className="text-center">{t('poDetailsModal.loading')}</p>}
        {poDetails && (
          <>
            <div className="po-details-summary">
              <div><strong>{t('poDetailsModal.summary.supplier')}</strong> {poDetails.supplier_name}</div>
              <div><strong>{t('poDetailsModal.summary.status')}</strong> <span className={`status-badge status-${poDetails.status.toLowerCase()}`}>{t(`poStatuses.${poDetails.status}`)}</span></div>
              <div><strong>{t('poDetailsModal.summary.date')}</strong> {new Date(poDetails.date_created).toLocaleDateString()}</div>
              <div><strong>{t('poDetailsModal.summary.totalValue')}</strong> {formatCurrency(Number(poDetails.total_value))}</div>
            </div>

            {/* --- AUDIT HISTORY LIST --- */}
            <div style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                border: '1px solid var(--border-color)'
            }}>
                <h5 style={{ marginTop: 0, marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>Audit History (Latest 5)</h5>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {poDetails.history && poDetails.history.length > 0 ? (
                        poDetails.history.map((entry, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                                <span>
                                    <strong style={{ color: getActionColor(entry.action) }}>{entry.action}</strong> by <strong>{entry.changed_by_name}</strong>
                                </span>
                                <span style={{ color: '#888', fontSize: '0.8rem' }}>
                                    {formatDateTime(entry.changed_at)}
                                </span>
                            </div>
                        ))
                    ) : (
                         /* Fallback for old records */
                         <div>Created by: <strong>{poDetails.created_by_name}</strong></div>
                    )}
                </div>
            </div>

            <h4 className="po-items-header">{t('poDetailsModal.itemsHeader')}</h4>
            <div className="table-container" style={{padding: 0, border: 'none', boxShadow: 'none'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('poDetailsModal.table.productName')}</th>
                    <th>{t('poDetailsModal.table.quantity')}</th>
                    <th>{t('poDetailsModal.table.price')}</th>
                    <th className="text-right">{t('poDetailsModal.table.subtotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {poDetails.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(Number(item.price_per_item))}</td>
                      <td className="text-right">{formatCurrency(item.quantity * Number(item.price_per_item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>{t('common.close')}</button>
      </div>
    </Modal>
  );
};
export default PODetailsModal;