// File Location: client/src/components/users/AddUserModal.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { UserRole } from '../../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal = ({ isOpen, onClose, onSuccess }: AddUserModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', phone: '' });
  // --- STATE UPDATED FOR ROLES ARRAY ---
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['pharmacist']);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- NEW HANDLER FOR CHECKBOXES ---
  const handleRoleChange = (role: UserRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) // Uncheck: remove role
        : [...prev, role] // Check: add role
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selectedRoles.length === 0) {
      setError('A user must have at least one role.'); // Or use a translation key
      return;
    }
    try {
      // --- SUBMIT 'roles' ARRAY ---
      await api.post('/users', { ...formData, roles: selectedRoles });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.msg || t('notifications.userCreateError'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('addUserModal.title')}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" form="add-user-form" className="btn btn-primary">{t('common.saveUser')}</button>
        </>
      }
    >
      <form id="add-user-form" onSubmit={handleSubmit}>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">{t('addUserModal.usernameLabel')}</label>
          <input id="username" name="username" value={formData.username} onChange={handleChange} required 
            onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
            onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">{t('addUserModal.emailLabel')}</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required 
            onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
            onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('addUserModal.passwordLabel')}</label>
          <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required 
            onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
            onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
          />
          <small>{t('addUserModal.passwordHint')}</small>
        </div>
        <div className="form-group">
            <label htmlFor="phone">{t('addUserModal.phoneLabel')}</label>
            <input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
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
export default AddUserModal;