import React, { useEffect, useState } from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Acción',
  message = '¿Estás seguro de que quieres continuar?',
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  type = 'default', // 'default', 'danger', 'success'
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Estado de carga interno

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isProcessing) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isProcessing]);

  const handleClose = () => {
    if (isProcessing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Duración de la animación de salida
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await onConfirm();
      handleClose(); // Cierra el modal directamente
    } catch (error) {
    } finally {
      setIsProcessing(false);
    }
  };

  const getModalClass = () => {
    const classes = [];
    if (isClosing) classes.push('closing');
    if (type) classes.push(type);
    if (isProcessing) classes.push('loading');
    return classes.join(' ');
  };

  if (!isOpen && !isClosing) {
    return null;
  }

  return (
    <div
      className={`confirmation-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div 
        className={`confirmation-modal-content ${getModalClass()}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirmation-modal-actions">
          <button 
            className="btn-cancel"
            disabled={isProcessing}
            onClick={handleClose}
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm} 
            className={`btn-confirm ${type === 'danger' ? 'danger' : ''}`}
            disabled={isProcessing}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;