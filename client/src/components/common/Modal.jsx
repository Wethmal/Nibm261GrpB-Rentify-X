/**
 * @file Modal.jsx
 * @module Modal
 * @description Generic modal/dialog wrapper component. Renders a centered overlay with customizable content, title, close button, and optional action buttons (confirm/cancel). Supports click-outside-to-close and Escape key to dismiss. Used for confirmation dialogs, forms, and detail views throughout Rentify.
 * @dependencies react
 * @exports Modal: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React, { useEffect } from 'react';

function Modal({ isOpen, onClose, title, children, className = '' }) {
  // TODO: Trap focus inside the modal for accessibility (tab cycling)
  // TODO: Add animation for open/close transitions (fade + scale)
  // TODO: Prevent body scroll when modal is open
  // TODO: Close on Escape key press
  // TODO: Close on overlay (backdrop) click

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${className}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
