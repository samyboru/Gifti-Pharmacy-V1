// File Location: client/src/components/purchaseOrders/AddPOModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import api from '../../services/api';
import { Product, Supplier } from '../../types';
import { LuTrash2, LuSearch } from 'react-icons/lu';
import { formatCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

// --- FIX: explicitly allow null for supplier_id ---
export interface POToEdit {
  id: number;
  supplier_name?: string | null; 
  supplier_id?: number | null; 
}

interface AddPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: POToEdit | null; 
}

interface POItem {
  productId: number;
  productName: string;
  quantity: number;
  cost: number;
}

const AddPOModal = ({ isOpen, onClose, onSuccess, initialData }: AddPOModalProps) => {
  const { t } = useTranslation();
  
  // Form State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [items, setItems] = useState<POItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // 1. Reset or Populate Form when Modal Opens
  useEffect(() => {
    if (isOpen) {
      // Fetch Suppliers
      api.get('/suppliers').then(res => setSuppliers(res.data));

      if (initialData) {
        // --- EDIT MODE: Fetch full details to get the items ---
        setIsFetchingDetails(true);
        api.get(`/purchase-orders/${initialData.id}`)
          .then(res => {
            const po = res.data;
            // Pre-fill Supplier (handle null/undefined safely)
            setSelectedSupplier(po.supplier_id ? String(po.supplier_id) : '');
            
            // Pre-fill Items (Map backend structure to frontend structure)
            const formattedItems = po.items ? po.items.map((item: any) => ({
                productId: item.product_id,
                productName: item.product_name,
                quantity: item.quantity,
                cost: Number(item.price_per_item)
            })) : [];
            setItems(formattedItems);
          })
          .catch(() => toast.error("Failed to load order details"))
          .finally(() => setIsFetchingDetails(false));
      } else {
        // --- CREATE MODE: Reset everything ---
        setSelectedSupplier('');
        setItems([]);
        setSearchTerm('');
        setSearchResults([]);
      }
    }
  }, [isOpen, initialData]);

 // 2. Product Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // --- FIX: Changed > 1 to > 0 so it searches on the first letter ---
      if (searchTerm.length > 0) { 
        api.get(`/products/search?query=${searchTerm}`).then(res => {
          setSearchResults(res.data);
        });
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddItem = (product: Product) => {
    if (items.find(i => i.productId === product.id)) {
      toast.error(t('addPOModal.itemExists'));
      return;
    }
    setItems([...items, { productId: product.id, productName: product.name, quantity: 1, cost: 0 }]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: 'quantity' | 'cost', value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // 3. Submit Logic (Handles both POST and PUT)
  const handleSubmit = async () => {
    if (!selectedSupplier) return toast.error(t('addPOModal.validation.supplier'));
    if (items.length === 0) return toast.error(t('addPOModal.validation.items'));
    if (items.some(i => i.quantity <= 0 || i.cost <= 0)) return toast.error(t('addPOModal.validation.invalidItems'));

    setLoading(true);
    const payload = {
      supplier_id: parseInt(selectedSupplier),
      items: items.map(i => ({
        product_id: i.productId,
        quantity: i.quantity,
        price_per_item: i.cost
      }))
    };

    try {
      if (initialData) {
        // --- UPDATE EXISTING PO ---
        await api.put(`/purchase-orders/${initialData.id}`, payload);
        toast.success("Purchase Order Updated Successfully");
      } else {
        // --- CREATE NEW PO ---
        await api.post('/purchase-orders', payload);
        toast.success(t('addPOModal.success'));
      }
      onSuccess();
      onClose();
    } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.msg || t('addPOModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={initialData ? `Edit Purchase Order #${initialData.id}` : t('addPOModal.title')} 
        size="lg"
    >
      <div className="add-po-form">
        
        {isFetchingDetails ? (
            <div className="text-center" style={{ padding: '2rem' }}>Loading order details...</div>
        ) : (
            <>
                {/* Header Section */}
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>{t('addPOModal.supplierLabel')}</label>
                    <select 
                        className="form-control" 
                        value={selectedSupplier} 
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                    >
                    <option value="">{t('addPOModal.selectSupplier')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                    <label>{t('addPOModal.searchLabel')}</label>
                    <div className="search-input-wrapper">
                    <LuSearch className="search-icon" />
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder={t('addPOModal.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </div>
                    {searchResults.length > 0 && (
                    <ul className="dropdown-results">
                        {searchResults.map(p => (
                        <li key={p.id} onClick={() => handleAddItem(p)}>
                            {p.name} <span className="brand">{p.brand}</span>
                        </li>
                        ))}
                    </ul>
                    )}
                </div>
                </div>

                {/* Items Table */}
                <div className="items-list-container" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
                {items.length === 0 ? (
                    <div className="empty-state">{t('addPOModal.noItems')}</div>
                ) : (
                    <table className="data-table">
                    <thead>
                        <tr>
                        <th>{t('addPOModal.table.product')}</th>
                        <th style={{ width: '100px' }}>{t('addPOModal.table.items')}</th>
                        <th style={{ width: '120px' }}>{t('addPOModal.table.cost')}</th>
                        <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                        <tr key={item.productId}>
                            <td>{item.productName}</td>
                            <td>
                            <input 
                                type="number" min="1" className="form-control-sm"
                                value={item.quantity} 
                                onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)} 
                            />
                            </td>
                            <td>
                            <input 
                                type="number" min="0" className="form-control-sm"
                                value={item.cost} 
                                onChange={(e) => handleItemChange(idx, 'cost', parseFloat(e.target.value) || 0)} 
                            />
                            </td>
                            <td>
                            <button className="btn-icon-danger" onClick={() => handleRemoveItem(idx)}>
                                <LuTrash2 />
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                )}
                </div>
            </>
        )}

        {/* Footer Section */}
        <div className="modal-footer-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div className="total-display">
             {t('addPOModal.total')}: <strong>{formatCurrency(totalValue)}</strong>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || isFetchingDetails}>
                {loading ? t('common.processing') : (initialData ? 'Update Order' : t('addPOModal.createButton', { count: items.length }))}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddPOModal;