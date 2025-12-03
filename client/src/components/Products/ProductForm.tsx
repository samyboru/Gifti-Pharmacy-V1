// File Location: client/src/components/products/AddProductModal.tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api.ts';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { customReactSelectStyles } from '../../styles/reactSelectStyles.ts';
// --- THIS PATH IS FIXED ---
import { PRODUCT_CATEGORIES } from '../../constants/index.ts';

type SelectOption = { value: string; label: string };

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialFormData = { name: '', brand: '', category: '', description: '', requires_prescription: false };

const AddProductModal = ({ isOpen, onClose, onSuccess }: AddProductModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const translatedCategoryOptions: SelectOption[] = useMemo(() => 
    PRODUCT_CATEGORIES.map((key: string) => ({
      value: key,
      label: t(`categories.${key}`)
    })), 
  [t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleCategoryChange = (selectedOption: SelectOption | null) => {
    setFormData(prev => ({ ...prev, category: selectedOption ? selectedOption.value : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(t('notifications.savingNewProduct'));
    try {
      await api.post('/products', formData);
      toast.success(t('notifications.productAddedSuccess'), { id: toastId });
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || t('notifications.productCreateError'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setFormData(initialFormData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('addProductModal.title')}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>{t('common.cancel')}</button>
          <button type="submit" form="add-product-form" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </>
      }
    >
      <form id="add-product-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">{t('addProductModal.productNameLabel')}</label>
          <input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-row">
            <div className="form-group">
                <label htmlFor="brand">{t('addProductModal.brandLabel')}</label>
                <input id="brand" name="brand" value={formData.brand} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="category">{t('addProductModal.categoryLabel')}</label>
                <Select
                    name="category"
                    options={translatedCategoryOptions}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={customReactSelectStyles}
                    onChange={handleCategoryChange}
                    placeholder={t('addProductModal.categoryPlaceholder')}
                    value={translatedCategoryOptions.find(opt => opt.value === formData.category) || null}
                />
            </div>
        </div>
        <div className="form-group">
            <label htmlFor="description">{t('addProductModal.descriptionLabel')}</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required></textarea>
        </div>
        <div className="form-group-checkbox">
            <input id="requires_prescription" name="requires_prescription" type="checkbox" checked={formData.requires_prescription} onChange={handleChange} />
            <label htmlFor="requires_prescription">{t('addProductModal.requiresPrescriptionLabel')}</label>
        </div>
      </form>
    </Modal>
  );
};
export default AddProductModal;