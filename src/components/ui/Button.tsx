import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-500 active:bg-primary-700 border border-primary-500/20',
        destructive: 'bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-500',
        outline: 'border-2 border-primary-600/50 text-primary-400 bg-transparent hover:bg-primary-600/10 hover:text-primary-300',
        secondary: 'bg-dark-800 text-dark-200 border border-dark-700 hover:bg-dark-700',
        ghost: 'hover:bg-dark-800/50 hover:text-dark-100',
        link: 'text-primary-400 underline-offset-4 hover:underline hover:text-primary-300',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
