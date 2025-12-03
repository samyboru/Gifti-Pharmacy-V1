// File Location: client/src/components/inventory/AdjustStockModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import { InventoryItem } from '../../types';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem | null;
}

const AdjustStockModal = ({ isOpen, onClose, onSuccess, item }: AdjustStockModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ quantity_of_packages: 0, selling_price: '0.00', expiry_date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        quantity_of_packages: item.quantity_of_packages || 0,
        selling_price: parseFloat(item.selling_price).toFixed(2) || '0.00',
        expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : '',
      });
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setLoading(true);
    const toastId = toast.loading('Updating stock...');
    try {
      await api.put(`/inventory/${item.id}`, {
        ...formData,
        selling_price: parseFloat(formData.selling_price),
        quantity_of_packages: parseInt(formData.quantity_of_packages.toString(), 10),
      });
      toast.success('Stock updated successfully!', { id: toastId });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update stock.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Stock: ${item?.name || ''}`} footer={
      <>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
        <button type="submit" form="adjust-stock-form" className="btn btn-primary" disabled={loading}>{loading ? t('common.saving') : t('common.saveChanges')}</button>
      </>
    }>
      <form id="adjust-stock-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name</label>
          <input value={item?.name || ''} disabled />
          <small>Batch: {item?.batch_number || 'N/A'}</small>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity_of_packages">Stock Quantity</label>
            <input id="quantity_of_packages" name="quantity_of_packages" type="number" value={formData.quantity_of_packages} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="selling_price">Selling Price</label>
            <input id="selling_price" name="selling_price" type="number" step="0.01" value={formData.selling_price} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="expiry_date">Expiry Date</label>
            <input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} required />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AdjustStockModal;