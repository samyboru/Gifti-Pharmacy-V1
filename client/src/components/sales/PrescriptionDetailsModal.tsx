// File Location: client/src/components/sales/PrescriptionDetailsModal.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.tsx';
import api from '../../services/api';
import { Doctor, InventoryItem } from '../../types';
import Select from 'react-select';
import { customReactSelectStyles } from '../../styles/reactSelectStyles.ts';
import AddDoctorModal from '../doctors/AddDoctorModal.tsx';
import { LuPlus, LuUpload } from 'react-icons/lu';

interface PrescriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (prescriptionId: number) => void;
  item: InventoryItem | null;
}

type DoctorOption = { value: number; label: string; };

const PrescriptionDetailsModal = ({ isOpen, onClose, onSuccess, item }: PrescriptionDetailsModalProps) => {
  const { t } = useTranslation();
  const [patientName, setPatientName] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);

  const fetchDoctors = () => {
    setLoading(true);
    api.get<Doctor[]>('/doctors')
      .then(res => setDoctors(res.data.map(d => ({ value: d.id, label: d.name }))))
      .catch(() => setError(t('prescriptionModal.errorLoad')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
    } else {
      setPatientName('');
      setSelectedDoctor(null);
      setPrescriptionFile(null);
      setError(null);
    }
  }, [isOpen, t]);

  const handleAddDoctorSuccess = (newDoctor: Doctor) => {
    const newDoctorOption = { value: newDoctor.id, label: newDoctor.name };
    setDoctors(prev => [...prev, newDoctorOption]);
    setSelectedDoctor(newDoctorOption);
    setIsAddDoctorModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
    } else {
      setPrescriptionFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !selectedDoctor) {
      setError(t('prescriptionModal.errorRequired'));
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('patient_name', patientName);
    formData.append('doctor_id', String(selectedDoctor.value));
    formData.append('product_id', String(item.product_id));
    if (prescriptionFile) {
      formData.append('prescriptionFile', prescriptionFile);
    }

    try {
      const response = await api.post('/prescriptions', formData);
      onSuccess(response.data.prescriptionId);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.msg || t('prescriptionModal.errorSave'));
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('prescriptionModal.title', { name: item.name })}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</button>
            <button type="submit" form="prescription-form" className="btn btn-primary" disabled={loading}>
              {loading ? t('common.saving') : t('prescriptionModal.confirmButton')}
            </button>
          </>
        }
      >
        <form id="prescription-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="patientName">{t('prescriptionModal.patientNameLabel')}</label>
            <input 
              id="patientName" 
              type="text" 
              value={patientName} 
              onChange={e => setPatientName(e.target.value)} 
              required 
              // --- THIS IS THE FIX ---
              onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
              onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
            />
          </div>
          <div className="form-group">
            <label>{t('prescriptionModal.doctorLabel')}</label>
            <div className="input-with-button">
              <Select
                name="doctor"
                options={doctors}
                isLoading={loading && doctors.length === 0}
                className="react-select-container flex-grow"
                classNamePrefix="react-select"
                value={selectedDoctor}
                onChange={(option) => setSelectedDoctor(option)}
                styles={customReactSelectStyles}
                placeholder={t('prescriptionModal.doctorPlaceholder')}
                required
              />
              <button 
                type="button" 
                className="btn btn-secondary btn-icon" 
                onClick={() => setIsAddDoctorModalOpen(true)}
                title={t('prescriptionModal.addDoctorTooltip')}
              >
                <LuPlus />
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="prescriptionFile">{t('prescriptionModal.uploadLabel')}</label>
            <label className="file-input-label">
                <LuUpload />
                <span>{prescriptionFile ? prescriptionFile.name : t('prescriptionModal.chooseFile')}</span>
                <input 
                    id="prescriptionFile" 
                    type="file" 
                    accept="image/png, image/jpeg, application/pdf"
                    onChange={handleFileChange}
                    className="file-input"
                />
            </label>
          </div>
        </form>
      </Modal>
      
      <AddDoctorModal 
        isOpen={isAddDoctorModalOpen}
        onClose={() => setIsAddDoctorModalOpen(false)}
        onSuccess={handleAddDoctorSuccess}
      />
    </>
  );
};

export default PrescriptionDetailsModal;