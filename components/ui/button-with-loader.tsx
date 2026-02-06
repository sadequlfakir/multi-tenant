'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ButtonWithLoaderProps extends ButtonProps {
  loading?: boolean
  /** Shown when loading (e.g. "Saving..."). If not set, children are still shown with a spinner. */
  loadingLabel?: string
}

const ButtonWithLoader = React.forwardRef<HTMLButtonElement, ButtonWithLoaderProps>(
  ({ loading = false, loadingLabel, children, className, disabled, ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const sizeWhenNotLoading = React.useRef<{ width: number; height: number } | null>(null)
    const mergedRef = React.useMemo(
      () => (node: HTMLButtonElement | null) => {
        (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
      },
      [ref]
    )
    const [minSize, setMinSize] = React.useState<{ width: number; height: number } | null>(null)

    React.useLayoutEffect(() => {
      if (!loading && buttonRef.current) {
        const { width, height } = buttonRef.current.getBoundingClientRect()
        sizeWhenNotLoading.current = { width, height }
        setMinSize(null)
      }
      if (loading && sizeWhenNotLoading.current) {
        setMinSize(sizeWhenNotLoading.current)
      }
    }, [loading])

    return (
      <Button
        ref={mergedRef}
        className={cn(className)}
        disabled={disabled || loading}
        style={
          loading && minSize
            ? { minWidth: minSize.width, minHeight: minSize.height }
            : undefined
        }
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            <span>{loadingLabel ?? children}</span>
          </span>
        ) : (
          children
        )}
      </Button>
    )
  }
)
ButtonWithLoader.displayName = 'ButtonWithLoader'

export { ButtonWithLoader }
