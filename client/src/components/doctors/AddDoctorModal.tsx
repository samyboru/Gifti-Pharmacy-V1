// File Location: client/src/components/doctors/AddDoctorModal.tsx

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { Doctor } from '../../types';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoctor: Doctor) => void;
}

const AddDoctorModal = ({ isOpen, onClose, onSuccess }: AddDoctorModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setName('');
    setLicenseNumber('');
    setSpecialty('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/doctors', {
        name,
        license_number: licenseNumber,
        specialty
      });
      onSuccess(response.data);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.msg || t('addDoctorModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('addDoctorModal.title')}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>{t('common.cancel')}</button>
          <button type="submit" form="add-doctor-form" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.saving') : t('addDoctorModal.saveButton')}
          </button>
        </>
      }
    >
      <form id="add-doctor-form" onSubmit={handleSubmit}>
        {error && <div className="login-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="doctorName">{t('addDoctorModal.fullNameLabel')}</label>
          <input id="doctorName" type="text" value={name} onChange={e => setName(e.target.value)} required 
            onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
            onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="licenseNumber">{t('addDoctorModal.licenseLabel')}</label>
            <input id="licenseNumber" type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} required 
              onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
              onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="specialty">{t('addDoctorModal.specialtyLabel')}</label>
            <input id="specialty" type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddDoctorModal;