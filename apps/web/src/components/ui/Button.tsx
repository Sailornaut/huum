'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  /** Alias for isLoading */
  loading?: boolean;
}

const variantStyles = {
  primary:
    'bg-gradient-huum text-white hover:opacity-90 shadow-md shadow-huum-coral-200/50 active:shadow-sm',
  secondary:
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, loading, children, disabled, className = '', ...props }, ref) => {
    const busy = isLoading || loading;
    return (
      <button
        ref={ref}
        disabled={disabled || busy}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
