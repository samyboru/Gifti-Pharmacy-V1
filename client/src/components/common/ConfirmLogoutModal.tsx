// File Location: client/src/components/common/ConfirmLogoutModal.tsx
import { useTranslation } from 'react-i18next'; // <-- Import hook
import Modal from './Modal.tsx';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmLogoutModal = ({ isOpen, onClose, onConfirm }: ConfirmLogoutModalProps) => {
  const { t } = useTranslation(); // <-- Initialize hook

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t('confirmLogoutModal.title')}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{t('sidebar.logout')}</button>
        </>
      }
    >
      <div className="confirmation-body">
        <p>{t('confirmLogoutModal.message')}</p>
      </div>
    </Modal>
  );
};

export default ConfirmLogoutModal;