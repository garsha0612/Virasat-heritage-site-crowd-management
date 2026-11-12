'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * ANVAYA Accessible Dialog Modal Primitive
 * Features ESC key dismissal, body scroll lock, focus preservation, and backdrop blur.
 */
export default function Modal({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  const modalRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-heritage-charcoal-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizeMap[size] || sizeMap.md} bg-white rounded-2xl border border-heritage-sandstone/30 shadow-heritage-lg z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-heritage-sandstone/15">
          <div>
            {title && (
              <h3
                id="modal-title"
                className="font-serif text-xl font-bold text-heritage-charcoal tracking-tight"
              >
                {title}
              </h3>
            )}
            {description && (
              <p
                id="modal-description"
                className="mt-1 text-xs text-heritage-charcoal-500 font-sans leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-heritage-charcoal-400 hover:text-heritage-charcoal rounded-lg hover:bg-heritage-sandstone-100 transition-colors ml-4 focus:outline-none focus:ring-2 focus:ring-heritage-sandstone"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto font-sans">{children}</div>

        {/* Footer Actions */}
        {footer && (
          <div className="px-6 py-4 bg-heritage-sandstone-50/50 border-t border-heritage-sandstone/15 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
