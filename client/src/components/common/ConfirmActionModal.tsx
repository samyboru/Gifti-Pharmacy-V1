// File Location: client/src/components/common/ConfirmActionModal.tsx
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

// --- FIX: Use the NEW name 'LuTriangleAlert' ---
import { LuTriangleAlert } from 'react-icons/lu';

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDanger?: boolean;
}

const ConfirmActionModal = ({ 
  isOpen, onClose, onConfirm, title, message, confirmLabel, isDanger = false 
}: ConfirmActionModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ 
            background: isDanger ? 'rgba(255, 99, 132, 0.1)' : 'rgba(54, 162, 235, 0.1)', 
            width: '60px', height: '60px', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem auto', color: isDanger ? '#ff6384' : '#36a2eb'
        }}>
            {/* --- FIX: Update the Icon Component Here --- */}
            <LuTriangleAlert size={30} />
        </div>
        
        <h3 style={{ margin: '0 0 0.5rem 0' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ minWidth: '100px' }}>
                {t('common.cancel')}
            </button>
            <button 
                className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} 
                onClick={() => { onConfirm(); onClose(); }} 
                style={{ minWidth: '100px' }}
            >
                {confirmLabel || t('common.confirm')}
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmActionModal;