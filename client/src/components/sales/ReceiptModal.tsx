// File Location: client/src/components/sales/ReceiptModal.tsx

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { Receipt } from '../../types';
import { LuPrinter, LuRotateCw, LuX } from 'react-icons/lu';
import './ReceiptModal.css';
import { formatCurrency } from '../../utils/currency';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number | null;
  context?: 'pos' | 'history';
}

const ReceiptModal = ({ isOpen, onClose, saleId, context = 'pos' }: ReceiptModalProps) => {
  const { t } = useTranslation();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && saleId) {
      setLoading(true);
      setReceipt(null);
      api.get<Receipt>(`/sales/${saleId}`)
        .then(res => setReceipt(res.data))
        .catch(err => console.error("Failed to fetch receipt", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, saleId]);

  const handlePrint = () => {
    const printContent = printAreaRef.current;
    if (printContent) {
      printContent.classList.add('print-area');
      window.print();
      printContent.classList.remove('print-area');
    }
  };

  const modalTitle = context === 'pos' 
    ? t('receiptModal.titleComplete', { id: saleId }) 
    : t('receiptModal.titleHistory', { id: saleId });
  
  const renderFooter = () => {
    if (context === 'pos') {
      return (
        <div className="receipt-footer-actions">
          <button className="btn btn-secondary" onClick={handlePrint} disabled={!receipt}><LuPrinter size={18} /> {t('receiptModal.printReceipt')}</button>
          <button className="btn btn-primary" onClick={onClose}><LuRotateCw size={18} /> {t('receiptModal.startNewSale')}</button>
        </div>
      );
    } else {
      return (
        <div className="receipt-footer-actions">
          <button className="btn btn-secondary" onClick={onClose}><LuX size={18} /> {t('common.close')}</button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={!receipt}><LuPrinter size={18} /> {t('receiptModal.print')}</button>
        </div>
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="md" footer={renderFooter()}>
      <div className="receipt-modal-body">
        {loading && <p className="text-center">{t('receiptModal.loading')}</p>}
        {receipt && (
          <div ref={printAreaRef}>
            <div className="receipt-header">
              <h2>GO-Pharma</h2>
              <p>{t('receiptModal.header')}</p>
            </div>
            <div className="receipt-details">
              <span>{t('receiptModal.saleId')} {receipt.id}</span>
              <span>{t('receiptModal.date')} {new Date(receipt.sale_date).toLocaleString()}</span>
              <span>{t('receiptModal.cashier')} {receipt.cashier_name}</span>
            </div>
            <table className="receipt-items-table">
              <thead><tr><th>{t('receiptModal.table.item')}</th><th className="align-right">{t('receiptModal.table.qty')}</th><th className="align-right">{t('receiptModal.table.price')}</th><th className="align-right">{t('receiptModal.table.total')}</th></tr></thead>
              <tbody>
                {receipt.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product_name}</td>
                    <td className="align-right">{item.quantity_sold}</td>
                    <td className="align-right">{formatCurrency(Number(item.price_at_time_of_sale))}</td>
                    <td className="align-right">{formatCurrency(item.quantity_sold * Number(item.price_at_time_of_sale))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="receipt-summary">
              <div className="summary-row"><span>{t('pointOfSalePage.subtotal')}:</span><span>{formatCurrency(Number(receipt.total_amount) - Number(receipt.tax_amount))}</span></div>
              <div className="summary-row"><span>{t('pointOfSalePage.tax')}:</span><span>{formatCurrency(Number(receipt.tax_amount))}</span></div>
              <div className="summary-row total"><span>{t('pointOfSalePage.total')}:</span><span>{formatCurrency(Number(receipt.total_amount))}</span></div>
            </div>
            <div className="receipt-thank-you">
              <p>{t('receiptModal.thankYou')}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReceiptModal;