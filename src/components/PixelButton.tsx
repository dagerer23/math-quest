import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'blue' | 'white' | 'red' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
}

const variants = {
  green: 'bg-duolingo-green text-white btn-duolingo-green',
  blue: 'bg-duolingo-blue text-white btn-duolingo-blue',
  white: 'bg-white text-gray-700 btn-duolingo-white border border-gray-200',
  red: 'bg-duolingo-red text-white btn-duolingo-green',
  gray: 'bg-gray-200 text-gray-500 border border-gray-300',
}

const sizes = {
  sm: 'h-10 px-4 text-sm rounded-2xl',
  md: 'h-12 px-6 text-base rounded-2xl',
  lg: 'h-14 px-8 text-lg rounded-2xl',
}

export default function PixelButton({ variant = 'green', size = 'md', className, icon, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        'btn-3d select-none font-bold tracking-wide flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children && <span className="flex-shrink-0">{children}</span>}
    </button>
  )
}