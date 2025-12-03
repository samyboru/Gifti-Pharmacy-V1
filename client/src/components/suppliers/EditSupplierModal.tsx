// File Location: client/src/components/suppliers/EditSupplierModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // <-- Import hook
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { Supplier } from '../../types';
import toast from 'react-hot-toast';

interface EditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier: Supplier | null;
}

const EditSupplierModal = ({ isOpen, onClose, onSuccess, supplier }: EditSupplierModalProps) => {
  const { t } = useTranslation(); // <-- Initialize hook
  const [formData, setFormData] = useState({ name: '', contact_person: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
      });
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    setLoading(true);
    const toastId = toast.loading(t('notifications.updatingSupplier'));
    try {
      await api.put(`/suppliers/${supplier.id}`, formData);
      toast.success(t('notifications.supplierUpdateSuccess'), { id: toastId });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || t('notifications.supplierUpdateError'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editSupplierModal.title')}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
          <button type="submit" form="edit-supplier-form" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.saving') : t('common.saveChanges')}
          </button>
        </>
      }
    >
      <form id="edit-supplier-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('addSupplierModal.nameLabel')}</label>
          <input name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        </div>
        <div className="form-row">
            <div className="form-group">
                <label>{t('addSupplierModal.contactPersonLabel')}</label>
                <input name="contact_person" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} />
            </div>
            <div className="form-group">
                <label>{t('addSupplierModal.emailLabel')}</label>
                <input name="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
        </div>
        <div className="form-group">
            <label>{t('addSupplierModal.phoneLabel')}</label>
            <input name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
        </div>
      </form>
    </Modal>
  );
};
export default EditSupplierModal;