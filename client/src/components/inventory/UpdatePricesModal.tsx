// File Location: client/src/components/inventory/UpdatePricesModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { Product, InventoryItem } from '../../types';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';
import ConfirmActionModal from '../common/ConfirmDeleteModal.tsx';

interface UpdatePricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
  batches: InventoryItem[];
}

const UpdatePricesModal = ({ isOpen, onClose, onSuccess, product, batches }: UpdatePricesModalProps) => {
  const { t } = useTranslation();
  const [newPrice, setNewPrice] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({ title: '', message: '' });
  const [isWarningAcknowledged, setWarningAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen && batches.length > 0) {
      setSelectedBatchIds(batches.map(b => b.id));
      setNewPrice('');
      setError(null);
      setWarningAcknowledged(false);
    }
  }, [isOpen, batches]);

  const handleCheckboxChange = (batchId: number) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const proceedWithUpdate = async () => {
    if (!product) return;
    
    setLoading(true);
    try {
      await api.put(`/inventory/bulk-update-price`, { 
        productId: product.id,
        newPrice: parseFloat(newPrice), 
        batchIds: selectedBatchIds
      });
      toast.success("Prices updated successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || "Failed to update prices.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
    }
  };

  const handleAcknowledgeWarning = () => {
    setWarningAcknowledged(true);
    setIsConfirmModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || selectedBatchIds.length === 0 || !newPrice) {
        setError("Please select at least one batch and enter a new price.");
        return;
    }
    setError(null);

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
        setError("New price must be a positive number.");
        return;
    }

    const selectedBatches = batches.filter(b => selectedBatchIds.includes(b.id));
    if (selectedBatches.length > 0) {
      const minCurrentPrice = Math.min(...selectedBatches.map(b => Number(b.selling_price)));

      if (price < minCurrentPrice && !isWarningAcknowledged) {
          setConfirmModalContent({
              title: 'Price Decrease Warning',
              message: `The new price (${formatCurrency(price)}) is lower than the current minimum price (${formatCurrency(minCurrentPrice)}). This may result in a loss. Click OK to proceed to update.`
          });
          setIsConfirmModalOpen(true);
          return;
      }
    }

    await proceedWithUpdate();
  };

  if (!product) return null;

  return (
    <>
      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleAcknowledgeWarning}
        title={confirmModalContent.title}
        message={confirmModalContent.message}
        loading={false} // Loading should not show on acknowledgement
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonVariant="primary"
        iconType="warning" 
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Update Prices for ${product.name}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
            <button type="submit" form="update-prices-form" className="btn btn-primary" disabled={loading || selectedBatchIds.length === 0}>
              {loading ? t('common.saving') : 'Update Prices'}
            </button>
          </>
        }
      >
        <form id="update-prices-form" onSubmit={handleSubmit}>
          {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          
          {/* --- THIS IS THE FIX --- */}
          <div className="form-group">
              <label>Select batches to update:</label>
              <div className="batches-list">
                  {batches.map(batch => (
                      <label key={batch.id} className="batch-checkbox-item">
                          <input 
                              type="checkbox"
                              checked={selectedBatchIds.includes(batch.id)}
                              onChange={() => handleCheckboxChange(batch.id)}
                          />
                          <span>Batch #{batch.batch_number || 'N/A'} (Current Price: {formatCurrency(Number(batch.selling_price))})</span>
                      </label>
                  ))}
              </div>
          </div>

          <div className="form-group">
            <label htmlFor="newPrice">New Selling Price</label>
            <input 
              id="newPrice" 
              type="number" 
              step="0.01"
              value={newPrice} 
              onChange={(e) => {
                setNewPrice(e.target.value);
                setWarningAcknowledged(false);
              }} 
              required 
              placeholder="Enter new price for selected batches"
            />
          </div>
        </form>
      </Modal>
    </>
  );
};

export default UpdatePricesModal;