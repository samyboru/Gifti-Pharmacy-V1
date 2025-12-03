import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import api from '../../services/api';
import { InventoryItem, Notification } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Link } from 'react-router-dom';
import DetailCard from '../common/DetailCard';

interface AlertDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
}

const AlertDetailsModal = ({ isOpen, onClose, notification }: AlertDetailsModalProps) => {
    const { t } = useTranslation();
    const [item, setItem] = useState<InventoryItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && notification?.product_id) {
            setLoading(true);
            setItem(null);
            
            // Attempt to extract batch from message if it exists in JSON format
            let batch: string | undefined;
            try {
                const parsedMessage = JSON.parse(notification.message);
                batch = (parsedMessage.batch === 'N/A') ? '' : parsedMessage.batch;
            } catch (e) {
                // Message might be plain text, just fetch by Product ID
            }

            api.get<InventoryItem[]>('/inventory/details', { params: { productId: notification.product_id, batch } })
                .then(res => {
                    if (res.data && res.data.length > 0) {
                        // If multiple batches, default to the first one (usually the problematic one due to SQL ordering)
                        setItem(res.data[0]);
                    } else {
                        setItem(null);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch alert details API:", err);
                    setItem(null);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, notification]);

    const title = item ? `Details for ${item.name}` : 'Alert Details';
    
    // --- LOGIC: Create a link that auto-searches for the specific batch ---
    const viewDetailsLink = item?.batch_number 
        ? `/inventory?search=${item.batch_number}` 
        : `/inventory?search=${item?.name || ''}`;

    return (
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          title={title}
          footer={
            <>
              <Link to={viewDetailsLink} className="btn btn-secondary" onClick={onClose}>
                View Full Details
              </Link>
              <button type="button" className="btn btn-primary" onClick={onClose}>{t('common.close')}</button>
            </>
          }
        >
            <div className="details-grid-container">
                {loading && <p className="text-center">{t('common.loading')}</p>}
                {!loading && !item && <p className="text-center">Could not load item details.</p>}
                {item && (
                    <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <DetailCard label="Batch #" value={item.batch_number || 'N/A'} />
                        <DetailCard label="Current Stock" value={item.quantity_of_packages} />
                        <DetailCard label="Selling Price" value={formatCurrency(Number(item.selling_price))} />
                        <DetailCard label="Expiry Date" value={new Date(item.expiry_date).toLocaleDateString()} />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AlertDetailsModal;