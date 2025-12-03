// File Location: client/src/components/common/ConfirmDeleteModal.tsx

import { useTranslation } from 'react-i18next';
import Modal from './Modal.tsx';
import { LuTrash2, LuCheck, LuTriangle, LuInfo } from 'react-icons/lu'; 

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'danger' | 'primary';
  iconType?: 'warning' | 'info' | 'danger';
}

const ConfirmActionModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    loading,
    confirmText,
    cancelText,
    confirmButtonVariant = 'danger',
    iconType = 'danger'
}: ConfirmActionModalProps) => {
  
  const { t } = useTranslation();
  
  const isDanger = confirmButtonVariant === 'danger';

  const renderIcon = () => {
    switch (iconType) {
      case 'warning': return <LuTriangle />;
      case 'info': return <LuInfo />;
      case 'danger':
      default: return <LuTriangle />;
    }
  };

  const getIconClass = () => {
    switch (iconType) {
        case 'warning': return 'icon-warning';
        case 'info': return 'icon-primary';
        case 'danger':
        default: return 'icon-danger';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="confirmation-body-enhanced">
        <div className={`confirmation-icon-wrapper ${getIconClass()}`}>
            {renderIcon()}
        </div>
        <p>{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
          {cancelText || t('common.cancel')}
        </button>
        <button 
          className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} 
          onClick={onConfirm} 
          disabled={loading}
        >
          {/* --- THIS IS THE FIX: Restored the button content --- */}
          {loading 
            ? t('common.loading') 
            : (
              <>
                {isDanger ? <LuTrash2 size={16} /> : <LuCheck size={16} />}
                {confirmText || t('confirmDeleteModal.confirm')}
              </>
            )
          }
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmActionModal;