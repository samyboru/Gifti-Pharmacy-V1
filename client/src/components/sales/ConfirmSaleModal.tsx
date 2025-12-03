// File Location: client/src/components/sales/ConfirmSaleModal.tsx

import { useTranslation } from 'react-i18next';
import { LuCheck, LuSend, LuPlus, LuTrash2 } from 'react-icons/lu'; 
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { CartItem, UserRole } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface ConfirmSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSale: () => void;
  onHandoff: () => void;
  onRemoveItem: (itemId: number) => void;
  cartItems: CartItem[];
  isProcessing: boolean;
  subtotal: number;
  tax: number;
  totalAmount: number;
}

const ConfirmSaleModal = ({ 
  isOpen, 
  onClose, 
  onConfirmSale, 
  onHandoff,
  onRemoveItem,
  cartItems,
  isProcessing,
  subtotal,
  tax,
  totalAmount
}: ConfirmSaleModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth(); 

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantityInCart, 0);

  const hasRole = (role: UserRole) => user?.role.includes(role);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('posConfirmModal.title')}
      size="md"
    >
      <div className="checkout-body">
        <p style={{padding: '0 1.5rem 1rem', borderBottom: '1px solid var(--border-color)'}}>{t('posConfirmModal.body')}</p>
        <ul className="checkout-item-list">
            {cartItems.map(item => (
                <li key={item.id} className="checkout-item">
                    <div className="item-info">
                        <span className="item-name">{item.name} <span className="item-quantity">x {item.quantityInCart}</span></span>
                        <span className="item-price">@ {formatCurrency(Number(item.selling_price))}</span>
                    </div>
                    <span className="item-total">{formatCurrency(item.quantityInCart * Number(item.selling_price))}</span>
                    <button className="btn-icon btn-icon-danger" onClick={() => onRemoveItem(item.id)} title={t('common.delete')}>
                        <LuTrash2 size={16}/>
                    </button>
                </li>
            ))}
        </ul>

        <div className="sale-summary-preview">
          <div className="summary-row">
            <span>{t('posConfirmModal.totalItems')}</span>
            <span>{totalItems}</span>
          </div>
          <div className="summary-row">
            <span>{t('pointOfSalePage.subtotal')}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
           <div className="summary-row">
            <span>{t('pointOfSalePage.tax')}</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="summary-row total">
            <span>{t('posConfirmModal.totalAmount')}</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="modal-footer checkout-footer">
        <button className="btn btn-secondary" onClick={onClose}>
            <LuPlus size={18} /> {t('posConfirmModal.addMore')}
        </button>
        <div className="finalize-actions">
            { (hasRole('cashier') || hasRole('admin')) ? (
              <button className="btn btn-primary" onClick={onConfirmSale} disabled={isProcessing}>
                {isProcessing ? t('common.processing') : <><LuCheck size={18} /> {t('pointOfSalePage.completeSale')}</>}
              </button>
            ) : hasRole('pharmacist') ? (
              // --- THIS BUTTON CLASS IS UPDATED ---
              <button className="btn btn-primary" onClick={onHandoff} disabled={isProcessing}>
                {isProcessing ? t('notifications.sendingToCashier') : <><LuSend size={18} /> {t('pointOfSalePage.sendToCashier')}</>}
              </button>
            ) : null }
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmSaleModal;