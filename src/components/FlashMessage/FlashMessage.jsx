import React, { useEffect } from 'react';
import './FlashMessage.css';

const FlashMessage = ({ message, type = 'error', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div className={`flash-message flash-message--${type}`}>
      <span>{message}</span>
      <button className="flash-message__close" onClick={onClose}>&times;</button>
    </div>
  );
};

export default FlashMessage;

