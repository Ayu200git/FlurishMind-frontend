import React from 'react';
import ReactDOM from 'react-dom';
import Button from '../Button/Button';
import './Modal.css';

const Modal = ({ title, children, onCancelModal, onAcceptModal, acceptEnabled, isLoading, selectedPost }) => {
  const modalRoot = document.getElementById('modal-root');

  if (!modalRoot) return null;  

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCancelModal) {
      onCancelModal();
    }
  };

  const handleAccept = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAcceptModal && acceptEnabled) {
      onAcceptModal();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return ReactDOM.createPortal(
    <div className="modal" onClick={handleModalClick}>
      <header className="modal__header">
        <h1>{title}</h1>
      </header>
      <div className="modal__content">{children}</div>
      <div className="modal__actions">
        <Button design="danger" mode="flat" onClick={handleCancel} type="button">
          Cancel
        </Button>
        <Button mode="raised" onClick={handleAccept} disabled={!acceptEnabled} loading={isLoading} type="button">
          {selectedPost ? 'Update' : 'Add'}
        </Button>
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;
