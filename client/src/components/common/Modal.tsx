// File Location: client/src/components/common/Modal.tsx
import ReactDOM from 'react-dom';
import { LuX } from 'react-icons/lu';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  // --- THIS IS THE FIX ---
  // Added 'sm' to the list of allowed sizes
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-backdrop" onMouseDown={handleBackdropClick}>
      <div className={`modal-content modal-${size}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-icon close-button" onClick={onClose}><LuX /></button>
        </div>
        <div className="data-form">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.getElementById('portal-root')!
  );
};
export default Modal;