// File Location: client/src/components/inventory/AddStockModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import { Product, Supplier } from '../../types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Select from 'react-select';
import { customReactSelectStyles } from '../../styles/reactSelectStyles';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialFormData = {
  product_id: null as number | null,
  supplier_id: null as number | null,
  quantity_of_packages: 1,
  selling_price: '0.00',
  purchase_price: '0.00',
  expiry_date: '',
  batch_number: '',
};

const AddStockModal = ({ isOpen, onClose, onSuccess }: AddStockModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialFormData);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch products and suppliers when the modal opens
      const fetchData = async () => {
        try {
          const [productsRes, suppliersRes] = await Promise.all([
            api.get('/products'),
            api.get('/suppliers'),
          ]);
          setProducts(productsRes.data);
          setSuppliers(suppliersRes.data);
        } catch (error) {
          toast.error("Failed to load necessary data.");
        }
      };
      fetchData();
    }
  }, [isOpen]);
  
  const productOptions = products.map(p => ({ value: p.id, label: p.name }));
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: 'product_id' | 'supplier_id', option: { value: number; label: string } | null) => {
    setFormData(prev => ({ ...prev, [name]: option ? option.value : null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.supplier_id) {
        toast.error("Product and Supplier are mandatory.");
        return;
    }
    setLoading(true);
    const toastId = toast.loading('Adding new stock...');
    try {
      await api.post('/inventory', {
        ...formData,
        selling_price: parseFloat(formData.selling_price),
        purchase_price: parseFloat(formData.purchase_price),
        quantity_of_packages: parseInt(formData.quantity_of_packages.toString(), 10),
      });
      toast.success('New stock added successfully!', { id: toastId });
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to add stock.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setFormData(initialFormData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Stock" size="lg" footer={
      <>
        <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>{t('common.cancel')}</button>
        <button type="submit" form="add-stock-form" className="btn btn-primary" disabled={loading}>
          {loading ? t('common.saving') : 'Save Stock'}
        </button>
      </>
    }>
      <form id="add-stock-form" onSubmit={handleSubmit}>
        <div className="form-row">
            <div className="form-group">
                <label>Product</label>
                <Select options={productOptions} styles={customReactSelectStyles} onChange={opt => handleSelectChange('product_id', opt)} placeholder="Select a product..." />
            </div>
            <div className="form-group">
                <label>Supplier</label>
                <Select options={supplierOptions} styles={customReactSelectStyles} onChange={opt => handleSelectChange('supplier_id', opt)} placeholder="Select a supplier..." />
            </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity_of_packages">Quantity</label>
            <input id="quantity_of_packages" name="quantity_of_packages" type="number" value={formData.quantity_of_packages} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="batch_number">Batch Number</label>
            <input id="batch_number" name="batch_number" type="text" value={formData.batch_number} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="expiry_date">Expiry Date</label>
            <input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
            <div className="form-group">
                <label htmlFor="purchase_price">Purchase Price (per package)</label>
                <input id="purchase_price" name="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="selling_price">Selling Price (per package)</label>
                <input id="selling_price" name="selling_price" type="number" step="0.01" value={formData.selling_price} onChange={handleChange} required />
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddStockModal;