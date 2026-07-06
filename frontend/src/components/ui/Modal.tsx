import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ title, onClose, children, className }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-lg animate-scale-in flex-col overflow-hidden rounded-modal border border-border-subtle bg-surface shadow-e3',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface px-6 py-5">
          <h2 id={titleId} className="text-lg font-semibold text-fg">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-fg-muted transition-colors hover:bg-subtle hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
