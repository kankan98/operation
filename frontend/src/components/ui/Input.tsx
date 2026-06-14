import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-input border bg-surface px-3 text-sm text-fg transition-colors duration-150 placeholder:text-fg-subtle',
        'focus:outline-none focus:ring-2 focus:ring-primary-200',
        error ? 'border-error focus:ring-error/30' : 'border-border focus:border-primary-400',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-11 w-full rounded-input border border-border bg-surface px-3 text-sm text-fg transition-colors duration-150',
      'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400',
      className,
    )}
    {...props}
  />
));
Select.displayName = 'Select';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-2 block text-sm font-medium text-fg', className)} {...props} />
  );
}
