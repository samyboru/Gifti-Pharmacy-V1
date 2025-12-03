// File Location: client/src/components/purchaseOrders/ReceivePOModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PurchaseOrderDetails } from '../../types';

interface ReceivePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrderId: number | null;
}

interface ReceiveItemState {
  product_id: number;
  product_name: string;
  quantity: number;
  batch_number: string;
  expiry_date: string;
  selling_price: number;
  purchase_price: number;
}

const ReceivePOModal = ({ isOpen, onClose, onSuccess, purchaseOrderId }: ReceivePOModalProps) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ReceiveItemState[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseOrderId) {
      setLoading(true);
      api.get<PurchaseOrderDetails>(`/purchase-orders/${purchaseOrderId}`)
        .then(res => {
          const initialItems = res.data.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            batch_number: '',
            expiry_date: '',
            selling_price: 0,
            purchase_price: Number(item.price_per_item) 
          }));
          setItems(initialItems);
        })
        .catch(() => toast.error("Failed to load items"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, purchaseOrderId]);

  const handleChange = (index: number, field: keyof ReceiveItemState, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    // --- STRICT VALIDATION LOOP ---
    for (const item of items) {
      // 1. Batch Number Required
      if (!item.batch_number.trim()) {
        return toast.error(`Batch Number is required for ${item.product_name}`);
      }

      // 2. Expiry Date Validation (> 1 Year)
      if (!item.expiry_date) {
        return toast.error(`Expiry Date is required for ${item.product_name}`);
      }
      const expiryDate = new Date(item.expiry_date);
      if (expiryDate < oneYearFromNow) {
         return toast.error(`Invalid Expiry for ${item.product_name}: Must be at least 1 year from today.`);
      }

      // 3. Selling Price Logic (> Purchase Price)
      if (item.selling_price <= 0) {
         return toast.error(`Selling price for ${item.product_name} must be positive.`);
      }
      if (item.selling_price <= item.purchase_price) {
         return toast.error(`Profit Error: Selling price for ${item.product_name} must be greater than Purchasing Price.`);
      }
    }

    setLoading(true);
    try {
      const payload = items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        batch_number: i.batch_number,
        expiry_date: i.expiry_date,
        selling_price: i.selling_price,
        price_per_item: i.purchase_price 
      }));

      await api.put(`/purchase-orders/${purchaseOrderId}/receive`, { receivedItems: payload });
      onSuccess();
      onClose();
    } catch (error: any) {
      // Backend handles "Batch already exists" error (Code 23505) and returns it here
      toast.error(error.response?.data?.msg || "Failed to receive stock");
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Receive Stock for PO #${purchaseOrderId}`} size="lg">
      <div className="receive-form-container">
        {items.map((item, idx) => {
            // --- CALCULATION FOR VISUAL FEEDBACK ---
            
            // 1. Date Logic
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
            const isExpiryInvalid = expiryDate && expiryDate < oneYearFromNow;

            // 2. Price Logic
            const isPriceInvalid = item.selling_price > 0 && item.selling_price <= item.purchase_price;

            return (
              <div key={idx} className="receive-item-row" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>{item.product_name} <span style={{fontSize: '0.9em', color: 'var(--text-secondary)'}}>(Qty: {item.quantity})</span></h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                    
                    {/* BATCH NUMBER */}
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem' }}>Batch Number</label>
                        <input 
                            type="text" className="form-control" 
                            value={item.batch_number} 
                            onChange={(e) => handleChange(idx, 'batch_number', e.target.value)} 
                            placeholder="Unique Batch #" 
                        />
                    </div>

                    {/* EXPIRY DATE */}
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem' }}>Expiry Date</label>
                        <input 
                            type="date" className="form-control" 
                            value={item.expiry_date} 
                            onChange={(e) => handleChange(idx, 'expiry_date', e.target.value)}
                            style={isExpiryInvalid ? { borderColor: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.05)' } : {}}
                        />
                        {/* Warning Message */}
                        {isExpiryInvalid && (
                            <small style={{ color: '#ff6b6b', fontSize: '0.7rem', display: 'block', marginTop: '4px' }}>
                                ❌ Minimum 1 Year Required
                            </small>
                        )}
                    </div>

                    {/* PURCHASING PRICE */}
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#ebdf8a' }}>Purchasing Price</label>
                        <input 
                            type="number" min="0" step="0.01" className="form-control" 
                            value={item.purchase_price} 
                            onChange={(e) => handleChange(idx, 'purchase_price', parseFloat(e.target.value) || 0)} 
                        />
                    </div>

                    {/* SELLING PRICE */}
                    <div className="form-group">
                        <label style={{ fontSize: '0.85rem', color: '#8aebbd' }}>Selling Price</label>
                        <input 
                            type="number" min="0" step="0.01" className="form-control" 
                            value={item.selling_price} 
                            onChange={(e) => handleChange(idx, 'selling_price', parseFloat(e.target.value) || 0)} 
                            placeholder="0.00" 
                            style={isPriceInvalid ? { borderColor: '#ff6b6b' } : {}}
                        />
                        {/* Warning Message */}
                        {isPriceInvalid && (
                            <small style={{ color: '#ff6b6b', fontSize: '0.7rem', display: 'block', marginTop: '4px' }}>
                                ❌ Must be greater than {item.purchase_price}
                            </small>
                        )}
                    </div>
                </div>
              </div>
            );
        })}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>{loading ? t('common.processing') : t('receivePOModal.confirmButton')}</button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceivePOModal;