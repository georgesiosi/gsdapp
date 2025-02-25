import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

const baseButtonStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  whiteSpace: 'nowrap' as const,
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  height: '2.25rem',
  paddingLeft: '1rem',
  paddingRight: '1rem',
  paddingTop: '0.5rem',
  paddingBottom: '0.5rem',
  transition: 'background-color 150ms ease, color 150ms ease',
  cursor: 'pointer',
  border: 'none',
  outline: 'none',
}

const variantStyles = {
  default: {
    backgroundColor: '#000',
    color: '#fff',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  destructive: {
    backgroundColor: '#e11d48',
    color: '#fff',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  outline: {
    border: '1px solid #e2e8f0',
    backgroundColor: 'transparent',
    color: '#000',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
    color: '#000',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
    color: '#000',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
    height: 'auto',
    padding: 0,
  },
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: keyof typeof variantStyles
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ style, variant = 'default', asChild = false, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const buttonStyles = {
      ...baseButtonStyles,
      ...variantStyles[variant],
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' as const : 'auto' as const,
      ...style,
    }

    return (
      <Comp
        style={buttonStyles}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
