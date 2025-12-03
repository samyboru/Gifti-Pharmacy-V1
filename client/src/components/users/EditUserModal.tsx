// File Location: client/src/components/users/EditUserModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { User, UserRole } from '../../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

const EditUserModal = ({ isOpen, onClose, onSuccess, user }: EditUserModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ username: '', email: '', phone: '' });
  // --- STATE UPDATED FOR ROLES ARRAY ---
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      // --- SET ROLES ARRAY ---
      setSelectedRoles(user.role || []);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // --- NEW HANDLER FOR CHECKBOXES ---
  const handleRoleChange = (role: UserRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (selectedRoles.length === 0) {
      setError('A user must have at least one role.');
      return;
    }
    try {
      // --- SUBMIT 'roles' ARRAY ---
      await api.put(`/users/${user.id}`, { ...formData, roles: selectedRoles });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.msg || t('notifications.userUpdateError'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editUserModal.title')}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" form="edit-user-form" className="btn btn-primary">{t('common.saveChanges')}</button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={handleSubmit}>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label>{t('addUserModal.usernameLabel')}</label>
          <input name="username" value={formData.username} onChange={handleChange} required 
            onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
            onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
          />
        </div>
        <div className="form-group">
          <label>{t('addUserModal.emailLabel')}</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required 
            onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
            onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
          />
        </div>
        <div className="form-group">
            <label>{t('addUserModal.phoneLabel')}</label>
            <input name="phone" value={formData.phone} onChange={handleChange} />
        </div>
        {/* --- THIS SECTION IS REPLACED --- */}
        <div className="form-group">
            <label>{t('addUserModal.roleLabel')}</label>
            <div className="role-checkbox-group">
                <label>
                    <input type="checkbox" checked={selectedRoles.includes('pharmacist')} onChange={() => handleRoleChange('pharmacist')} />
                    {t('roles.pharmacist')}
                </label>
                <label>
                    <input type="checkbox" checked={selectedRoles.includes('cashier')} onChange={() => handleRoleChange('cashier')} />
                    {t('roles.cashier')}
                </label>
            </div>
        </div>
      </form>
    </Modal>
  );
};
export default EditUserModal;