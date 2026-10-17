import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary', // 'primary', 'danger', 'warning'
  icon,
  inputLabel,
  inputPlaceholder,
  inputRequired = false,
  inputValue = '',
  onInputChange,
  isTextarea = false,
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputRequired && !inputValue.trim()) return;
    onConfirm();
  };

  const getIcon = () => {
    if (icon) return icon;
    if (type === 'danger') return <AlertTriangle size={24} color="#DC2626" />;
    if (type === 'warning') return <AlertCircle size={24} color="#D97706" />;
    return <CheckCircle2 size={24} color="#174C38" />;
  };

  const confirmBtnStyle =
    type === 'danger'
      ? { backgroundColor: '#DC2626', borderColor: '#DC2626' }
      : type === 'warning'
      ? { backgroundColor: '#D97706', borderColor: '#D97706' }
      : {};

  return (
    <div className="shelter-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="shelter-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 500 }}
      >
        <div className="shelter-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor:
                  type === 'danger'
                    ? '#FEE2E2'
                    : type === 'warning'
                    ? '#FEF3C7'
                    : 'var(--shelter-primary-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getIcon()}
            </div>
            <div>
              <h3 className="shelter-modal-title" style={{ fontSize: '1.2rem' }}>
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="shelter-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="shelter-modal-body">
            {description && (
              <p
                style={{
                  margin: '0 0 1rem 0',
                  color: 'var(--shelter-text-body)',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                }}
              >
                {description}
              </p>
            )}

            {inputLabel && (
              <div className="shelter-form-group" style={{ marginBottom: 0 }}>
                <label className="shelter-form-label">
                  {inputLabel} {inputRequired && <span className="required">*</span>}
                </label>
                {isTextarea ? (
                  <textarea
                    className="shelter-form-textarea"
                    placeholder={inputPlaceholder}
                    value={inputValue}
                    onChange={(e) => onInputChange?.(e.target.value)}
                    required={inputRequired}
                    autoFocus
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    className="shelter-form-input"
                    placeholder={inputPlaceholder}
                    value={inputValue}
                    onChange={(e) => onInputChange?.(e.target.value)}
                    required={inputRequired}
                    autoFocus
                  />
                )}
              </div>
            )}
          </div>

          <div className="shelter-modal-footer">
            <button
              type="button"
              className="shelter-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="shelter-btn-primary"
              style={confirmBtnStyle}
              disabled={loading || (inputRequired && !inputValue.trim())}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmModal;
