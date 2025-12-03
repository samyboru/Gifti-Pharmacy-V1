// File Location: client/src/pages/CashierQueuePage.tsx

import { useState, useEffect, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../services/api';
import { PendingSale, CartItem } from '../types';
import { LuClock, LuUser, LuShoppingBag } from 'react-icons/lu';
import Modal from '../components/common/Modal.tsx';
import ReceiptModal from '../components/sales/ReceiptModal.tsx';
import { formatCurrency } from '../utils/currency';

// --- MODAL COMPONENT ---
const CompleteSaleModal = ({ isOpen, onClose, onSuccess, sale, total }: any) => {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);

    const handleComplete = async () => {
        setIsProcessing(true);
        try {
            const response = await api.post('/sales', { pending_sale_id: sale.id });
            toast.success(response.data.message || t('notifications.saleCompleteSuccess'));
            setCompletedSaleId(response.data.saleId);
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || t('cashierQueuePage.modal.error'));
        } finally {
            setIsProcessing(false);
        }
    };
    const closeReceiptModal = () => setCompletedSaleId(null);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={t('cashierQueuePage.modal.title', { id: sale.id })}>
                <div className="confirmation-body">
                    <p>{t('cashierQueuePage.modal.body')}</p>
                    <h2 className="text-center" style={{fontSize: '2.5rem', color: 'var(--accent-color)'}}>{formatCurrency(total)}</h2>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>{t('common.cancel')}</button>
                    <button className="btn btn-success" onClick={handleComplete} disabled={isProcessing}>
                        {isProcessing ? t('common.processing') : t('cashierQueuePage.modal.confirmButton')}
                    </button>
                </div>
            </Modal>
            <ReceiptModal isOpen={!!completedSaleId} onClose={closeReceiptModal} saleId={completedSaleId} />
        </>
    );
};


// Main Page Component
const CashierQueuePage = (): JSX.Element => {
  const { t } = useTranslation();
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<PendingSale | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fetchPendingSales = () => {
    if(loading) setLoading(true);
    api.get<PendingSale[]>('/sales/pending')
      .then(res => setPendingSales(res.data))
      .catch(() => setError(t('cashierQueuePage.fetchError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendingSales();
    const interval = setInterval(fetchPendingSales, 15000);
    return () => clearInterval(interval);
  }, [t]);
  
  const openConfirmModal = (sale: PendingSale) => {
    setSelectedSale(sale);
    setIsConfirmModalOpen(true);
  };
  
  const calculateTotal = (cart: CartItem[]) => {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.selling_price) * item.quantityInCart, 0);
    return subtotal * 1.10;
  };

  return (
    <>
      <div className="header">
        <h1>{t('cashierQueuePage.title')}</h1>
      </div>
      <div className="content-card">
        <div className="content-card-header">
          <h2>{t('cashierQueuePage.header')}</h2>
          <p>{t('cashierQueuePage.description')}</p>
        </div>
        <div className="user-cards-grid">
          {loading && <p className="text-center">{t('cashierQueuePage.loading')}</p>}
          {error && <p className="login-error text-center">{error}</p>}
          {!loading && pendingSales.length === 0 && <p className="text-center">{t('cashierQueuePage.empty')}</p>}
          {pendingSales.map(sale => (
            <div key={sale.id} className="user-card clickable" onClick={() => openConfirmModal(sale)}>
              <div className="user-card-header">
                <div className="user-card-avatar" style={{backgroundColor: 'var(--accent-color)'}}><LuShoppingBag /></div>
                <div className="user-card-info">
                  <h3 className="user-card-name">{t('cashierQueuePage.saleCardTitle', { id: sale.id })}</h3>
                  <span className="user-card-contact"><LuUser size={14}/> {sale.pharmacist_name}</span>
                </div>
              </div>
              <div className="user-card-body">
                <p><LuClock size={14}/> {t('cashierQueuePage.sentAt')} {new Date(sale.created_at).toLocaleTimeString()}</p>
                <p><strong>{t('cashierQueuePage.total')} {formatCurrency(calculateTotal(sale.cart_data))}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedSale && (
        <CompleteSaleModal 
            isOpen={isConfirmModalOpen} 
            onClose={() => setIsConfirmModalOpen(false)}
            onSuccess={fetchPendingSales}
            sale={selectedSale}
            total={calculateTotal(selectedSale.cart_data)}
        />
      )}
    </>
  );
};

export default CashierQueuePage;