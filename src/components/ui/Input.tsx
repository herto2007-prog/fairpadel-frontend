import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-dark-800 bg-dark-900 px-4 py-3 text-sm',
          'text-dark-100 placeholder:text-dark-500',
          'focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200 outline-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
