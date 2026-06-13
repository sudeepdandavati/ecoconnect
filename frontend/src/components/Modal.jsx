import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'grid',
      placeItems: 'center',
      padding: '24px',
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 7, 10, 0.85)',
          backdropFilter: 'blur(8px)',
        }} 
      />

      {/* Modal Dialog */}
      <div 
        className="card" 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          zIndex: 1,
          animation: 'modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {title && (
          <h2 style={{
            fontSize: '1.4rem',
            marginBottom: '16px',
            color: '#fff',
            fontFamily: 'var(--font-display)',
          }}>
            {title}
          </h2>
        )}

        <div style={{ marginTop: '12px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes modal-pop {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;
