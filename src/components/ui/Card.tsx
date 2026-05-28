import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  hover?: boolean
}

export function Card({ glass, hover, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border',
        glass
          ? 'bg-white/70 backdrop-blur-md border-white/40 shadow-lg'
          : 'bg-white border-slate-200 shadow-sm',
        hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('px-6 pt-6 pb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('px-6 pb-6 pt-4 border-t border-slate-100', className)} {...props}>
      {children}
    </div>
  )
}
