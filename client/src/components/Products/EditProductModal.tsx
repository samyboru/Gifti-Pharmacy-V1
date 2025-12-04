// File Location: client/src/components/products/EditProductModal.tsx

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import Select, { SingleValue } from 'react-select';
import { Product } from '../../types';
import { customReactSelectStyles } from '../../styles/reactSelectStyles.ts';
import toast from 'react-hot-toast';
// --- THIS PATH IS FIXED ---
import { PRODUCT_CATEGORIES } from '../../constants';

type SelectOption = { value: string; label: string };

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

const EditProductModal = ({ isOpen, onClose, onSuccess, product }: EditProductModalProps) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ name: '', brand: '', category: '', description: '', requires_prescription: false });
    const [loading, setLoading] = useState(false);

    const translatedCategoryOptions: SelectOption[] = useMemo(() => 
      PRODUCT_CATEGORIES.map((key: string) => ({
        value: key,
        label: t(`categories.${key}`)
      })), 
    [t]);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                brand: product.brand || '',
                category: product.category || '',
                description: product.description || '',
                requires_prescription: product.requires_prescription || false,
            });
        }
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    };

    const handleCategoryChange = (selectedOption: SingleValue<SelectOption>) => {
        setFormData(prev => ({ ...prev, category: selectedOption ? selectedOption.value : '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;
        setLoading(true);
        const toastId = toast.loading(t('notifications.updatingProduct'));
        try {
            await api.put(`/products/${product.id}`, formData);
            toast.success(t('notifications.productUpdateSuccess'), { id: toastId });
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || t('notifications.productUpdateError'), { id: toastId });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title={t('editProductModal.title')}
          size="md"
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
              <button type="submit" form="edit-product-form" className="btn btn-primary" disabled={loading}>
                {loading ? t('common.saving') : t('common.saveChanges')}
              </button>
            </>
          }
        >
          <form id="edit-product-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>{t('addProductModal.productNameLabel')}</label>
                <input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>{t('addProductModal.brandLabel')}</label>
                    <input name="brand" value={formData.brand} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>{t('addProductModal.categoryLabel')}</label>
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
                <label>{t('addProductModal.descriptionLabel')}</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} required></textarea>
            </div>
            <div className="form-group-checkbox">
                <input id="requires_prescription_edit" name="requires_prescription" type="checkbox" checked={formData.requires_prescription} onChange={handleChange} />
                <label htmlFor="requires_prescription_edit">{t('addProductModal.requiresPrescriptionLabel')}</label>
            </div>
          </form>
        </Modal>
    );
};
export default EditProductModal;