// File Location: client/src/components/suppliers/AddSupplierModal.tsx

import { useState } from 'react';
import { useTranslation } from 'react-i18next'; // <-- Import hook
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSupplierModal = ({ isOpen, onClose, onSuccess }: AddSupplierModalProps) => {
  const { t } = useTranslation(); // <-- Initialize hook
  const [formData, setFormData] = useState({ name: '', contact_person: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  
  const handleClose = () => {
    setFormData({ name: '', contact_person: '', email: '', phone: '' });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(t('notifications.savingSupplier'));
    try {
      await api.post('/suppliers', formData);
      toast.success(t('notifications.supplierAddedSuccess'), { id: toastId });
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || t('notifications.supplierCreateError'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('addSupplierModal.title')}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>{t('common.cancel')}</button>
          <button type="submit" form="add-supplier-form" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.saving') : t('common.saveSupplier')}
          </button>
        </>
      }
    >
      <form id="add-supplier-form" onSubmit={handleSubmit}>
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
export default AddSupplierModal;