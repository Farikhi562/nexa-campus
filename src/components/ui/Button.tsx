import { forwardRef } from 'react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Variants
            'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98] shadow-sm':
              variant === 'primary',
            'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 active:scale-[0.98]':
              variant === 'secondary',
            'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-[0.98]':
              variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]':
              variant === 'danger',
            'border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-[0.98]':
              variant === 'outline',
            // Sizes
            'px-3 py-1.5 text-xs':   size === 'sm',
            'px-4 py-2.5 text-sm':   size === 'md',
            'px-6 py-3 text-base':   size === 'lg',
            // Full width
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Memproses...
          </>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
