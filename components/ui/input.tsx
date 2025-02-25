import * as React from "react"

const inputStyles = {
  height: '2.25rem',
  width: '100%',
  borderRadius: '0.375rem',
  border: '1px solid #e2e8f0',
  backgroundColor: 'transparent',
  paddingLeft: '0.75rem',
  paddingRight: '0.75rem',
  paddingTop: '0.25rem',
  paddingBottom: '0.25rem',
  fontSize: '1rem',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
  outline: 'none',
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ style, type, ...props }, ref) => {
    return (
      <input
        type={type}
        style={{ ...inputStyles, ...style }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
